/* proj_api.h compatibility implementation using proj 9 API */
#include <proj.h>
#include <stdlib.h>
#include <string.h>

int pj_errno = 0;

typedef struct {
    PJ *pj9;    /* The main PJ object (could be CRS or conversion) */
    PJ *crs;    /* CRS object (may differ from pj9 for conversions) */
    char *def;  /* Original proj4 string definition */
} PJcompat;

/* Helper: extract CRS from a PJ object (handles both CRS and conversion types) */
static PJ* get_crs_from_pj(PJ *p) {
    if (!p) return NULL;
    PJ_TYPE type = proj_get_type(p);
    /* If it's already a CRS type, return as-is (clone) */
    if (type == PJ_TYPE_GEOGRAPHIC_2D_CRS ||
        type == PJ_TYPE_GEOGRAPHIC_3D_CRS ||
        type == PJ_TYPE_GEOCENTRIC_CRS ||
        type == PJ_TYPE_PROJECTED_CRS ||
        type == PJ_TYPE_COMPOUND_CRS ||
        type == PJ_TYPE_BOUND_CRS ||
        type == PJ_TYPE_OTHER_CRS) {
        return proj_clone(PJ_DEFAULT_CTX, p);
    }
    /* For conversions/operations, try to get source CRS */
    PJ *src = proj_get_source_crs(PJ_DEFAULT_CTX, p);
    if (src) return src;
    /* Fallback: try normalize */
    PJ *norm = proj_normalize_for_visualization(PJ_DEFAULT_CTX, p);
    if (norm) {
        type = proj_get_type(norm);
        if (type == PJ_TYPE_GEOGRAPHIC_2D_CRS ||
            type == PJ_TYPE_GEOGRAPHIC_3D_CRS ||
            type == PJ_TYPE_PROJECTED_CRS) {
            return norm;
        }
        proj_destroy(norm);
    }
    return NULL;
}

void* pj_init_plus(const char *def) {
    PJ *p = proj_create(PJ_DEFAULT_CTX, def);
    if (!p) {
        pj_errno = proj_context_errno(PJ_DEFAULT_CTX);
        return NULL;
    }
    PJcompat *c = (PJcompat*)malloc(sizeof(PJcompat));
    c->pj9 = p;
    c->def = def ? strdup(def) : NULL;
    c->crs = get_crs_from_pj(p);
    return (void*)c;
}

void* pj_latlong_from_proj(void *pj) {
    if (!pj) return NULL;
    PJcompat *c = (PJcompat*)pj;

    PJcompat *r = (PJcompat*)malloc(sizeof(PJcompat));
    r->pj9 = NULL;
    r->crs = NULL;
    r->def = NULL;

    /* Try to get geodetic CRS from the CRS object */
    PJ *source = c->crs ? c->crs : c->pj9;
    PJ *longlat = proj_crs_get_geodetic_crs(PJ_DEFAULT_CTX, source);
    if (!longlat) {
        /* If it's already geographic, clone it */
        PJ_TYPE type = proj_get_type(source);
        if (type == PJ_TYPE_GEOGRAPHIC_2D_CRS || type == PJ_TYPE_GEOGRAPHIC_3D_CRS) {
            longlat = proj_clone(PJ_DEFAULT_CTX, source);
        }
    }

    /* Get the proj4 string representation of the geodetic CRS */
    const char *def_str = NULL;
    if (longlat) {
        def_str = proj_as_proj_string(PJ_DEFAULT_CTX, longlat, PJ_PROJ_4, NULL);
    }

    if (def_str && *def_str) {
        /* We have a proper def string - create a fresh PJ from it for reliable operation */
        r->def = strdup(def_str);
        r->pj9 = proj_create(PJ_DEFAULT_CTX, def_str);
        r->crs = longlat ? proj_clone(PJ_DEFAULT_CTX, longlat) : NULL;
    } else {
        /* Fall back to WGS84 longlat */
        r->def = strdup("+proj=longlat +datum=WGS84 +no_defs");
        r->pj9 = proj_create(PJ_DEFAULT_CTX, r->def);
        r->crs = NULL;
    }

    if (longlat) proj_destroy(longlat);

    if (!r->pj9) {
        if (r->crs) proj_destroy(r->crs);
        if (r->def) free(r->def);
        free(r);
        return NULL;
    }

    return (void*)r;
}

void pj_free(void *pj) {
    if (!pj) return;
    PJcompat *c = (PJcompat*)pj;
    if (c->pj9) proj_destroy(c->pj9);
    if (c->crs && c->crs != c->pj9) proj_destroy(c->crs);
    if (c->def) free(c->def);
    free(c);
}

char* pj_get_def(void *pj, int opts) {
    if (!pj) return NULL;
    PJcompat *c = (PJcompat*)pj;
    const char *s = NULL;

    /* Try CRS object first (more likely to give proj4 string) */
    PJ *target = c->crs ? c->crs : c->pj9;
    s = proj_as_proj_string(PJ_DEFAULT_CTX, target, PJ_PROJ_4, NULL);
    if (s && *s) return strdup(s);

    /* Try the raw pj9 object */
    if (c->crs && c->pj9 != c->crs) {
        s = proj_as_proj_string(PJ_DEFAULT_CTX, c->pj9, PJ_PROJ_4, NULL);
        if (s && *s) return strdup(s);
    }

    /* Fall back to stored def */
    if (c->def && *c->def) return strdup(c->def);

    /* Last resort */
    return strdup("+proj=longlat +datum=WGS84 +no_defs");
}

void pj_dalloc(void *p) { if (p) free(p); }

int pj_is_latlong(void *pj) {
    if (!pj) return 0;
    PJcompat *c = (PJcompat*)pj;
    /* Check the CRS object */
    PJ *target = c->crs ? c->crs : c->pj9;
    PJ_TYPE type = proj_get_type(target);
    if (type == PJ_TYPE_GEOGRAPHIC_2D_CRS || type == PJ_TYPE_GEOGRAPHIC_3D_CRS) return 1;
    /* Also check if the stored def suggests geographic */
    if (c->def && strstr(c->def, "+proj=longlat")) return 1;
    if (c->def && strstr(c->def, "+proj=latlong")) return 1;
    return 0;
}

int pj_is_geocent(void *pj) {
    if (!pj) return 0;
    PJcompat *c = (PJcompat*)pj;
    PJ *target = c->crs ? c->crs : c->pj9;
    PJ_TYPE type = proj_get_type(target);
    return (type == PJ_TYPE_GEOCENTRIC_CRS) ? 1 : 0;
}

/* Helper: create a proper CRS PJ from a def string or existing PJ */
static PJ* make_crs_pj(const char *def, PJ *existing_crs) {
    if (def && *def) {
        PJ *p = proj_create(PJ_DEFAULT_CTX, def);
        if (p) return p;
    }
    if (existing_crs) return proj_clone(PJ_DEFAULT_CTX, existing_crs);
    return NULL;
}

int pj_transform(void *src, void *dst, long point_count, int point_offset,
                 double *x, double *y, double *z) {
    if (!src || !dst) return -1;
    PJcompat *csrc = (PJcompat*)src;
    PJcompat *cdst = (PJcompat*)dst;

    /* Build the transformation using def strings which create proper CRS */
    const char *src_def = csrc->def ? csrc->def : NULL;
    const char *dst_def = cdst->def ? cdst->def : NULL;

    PJ *transform = NULL;

    /* Try using def strings for CRS-to-CRS transform */
    if (src_def && dst_def) {
        transform = proj_create_crs_to_crs(PJ_DEFAULT_CTX, src_def, dst_def, NULL);
    }

    /* Fallback: try using CRS objects */
    if (!transform) {
        PJ *psrc = csrc->crs ? csrc->crs : csrc->pj9;
        PJ *pdst = cdst->crs ? cdst->crs : cdst->pj9;
        transform = proj_create_crs_to_crs_from_pj(PJ_DEFAULT_CTX, psrc, pdst, NULL, NULL);
    }

    if (!transform) {
        pj_errno = proj_context_errno(PJ_DEFAULT_CTX);
        return pj_errno ? pj_errno : -1;
    }

    /* Normalize axis order for consistency */
    PJ *normalized = proj_normalize_for_visualization(PJ_DEFAULT_CTX, transform);
    if (normalized) {
        proj_destroy(transform);
        transform = normalized;
    }

    for (long i = 0; i < point_count; i++) {
        PJ_COORD in_coord;
        in_coord.lpz.lam = x[i];
        in_coord.lpz.phi = y[i];
        in_coord.lpz.z = z ? z[i] : 0.0;

        PJ_COORD out_coord = proj_trans(transform, PJ_FWD, in_coord);
        x[i] = out_coord.xyz.x;
        y[i] = out_coord.xyz.y;
        if (z) z[i] = out_coord.xyz.z;
    }

    proj_destroy(transform);
    return 0;
}

int* pj_get_errno_ref(void) { return &pj_errno; }

const char* pj_strerrno(int err) {
    return proj_errno_string(err);
}
