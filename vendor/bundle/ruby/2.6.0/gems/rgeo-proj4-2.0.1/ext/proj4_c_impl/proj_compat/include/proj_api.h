/* Standalone proj_api.h compatibility header for proj 8+ */
/* This avoids including proj.h which has the #error directive */
#ifndef proj_api_h
#define proj_api_h

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Opaque types */
typedef void *PJconsts;
typedef PJconsts *projPJ;
typedef void *projCtx;

/* UV coordinate pair */
typedef struct {
    double u, v;
} projUV;
typedef projUV projXY;
typedef projUV projLP;

/* Error codes */
extern int pj_errno;

/* Function declarations */
projPJ pj_init_plus(const char *);
projPJ pj_latlong_from_proj(projPJ);
void pj_free(projPJ);
char *pj_get_def(projPJ, int);
void pj_dalloc(void *);
int pj_is_latlong(projPJ);
int pj_is_geocent(projPJ);
int pj_transform(projPJ, projPJ, long, int, double *, double *, double *);
int *pj_get_errno_ref(void);
const char *pj_strerrno(int);

/* Macro for checking proj creation */
#define PJ_IS_LATLONG(pj) pj_is_latlong(pj)

/* proj version compat - proj 9 uses PROJ_VERSION_NUMBER */
#ifndef PJ_VERSION
#define PJ_VERSION 981
#endif

#ifdef __cplusplus
}
#endif

#endif /* proj_api_h */
