import { Camera, Globe, Mail, MessageCircle, Phone, Sprout } from 'lucide-react';
import Link from 'next/link';

export function StorefrontFooter() {
  return (
    <footer className="mt-16 bg-green-900 text-green-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold">
            <Sprout className="h-5 w-5" /> SenagrOS
          </p>
          <p className="mt-2 text-sm text-green-200">
            Des produits frais, directement des fermes sénégalaises à votre table.
          </p>
        </div>
        <div>
          <p className="mb-3 font-semibold">Liens utiles</p>
          <ul className="space-y-2 text-sm text-green-200">
            <li>
              <Link href="/catalogue" className="hover:text-white">
                Catalogue
              </Link>
            </li>
            <li>
              <Link href="/#comment-ca-marche" className="hover:text-white">
                Comment ça marche
              </Link>
            </li>
            <li>
              <Link href="/inscription-acheteur" className="hover:text-white">
                Créer un compte acheteur
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Espace producteur
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold">Contact</p>
          <ul className="space-y-2 text-sm text-green-200">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +221 33 800 00 00
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> contact@senagros.sn
            </li>
            <li>Dakar, Sénégal</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold">Suivez-nous</p>
          <div className="flex gap-3">
            <a
              href="https://facebook.com"
              aria-label="Facebook"
              className="rounded-full bg-green-800 p-2 hover:bg-green-700"
            >
              <Globe className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              className="rounded-full bg-green-800 p-2 hover:bg-green-700"
            >
              <Camera className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/221338000000"
              aria-label="WhatsApp"
              className="rounded-full bg-green-800 p-2 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <p className="border-t border-green-800 py-4 text-center text-xs text-green-300">
        © {new Date().getFullYear()} SenagrOS — Paiement à la livraison, Wave et Orange Money
        acceptés
      </p>
    </footer>
  );
}
