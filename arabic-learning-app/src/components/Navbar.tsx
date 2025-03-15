// components/Navbar.tsx
import Link from "next/link";

interface NavbarProps {
  currentCategory?: string;
}

export default function Navbar({ currentCategory }: NavbarProps) {
  return (
    <nav className="bg-green-900 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Home Link */}
        <Link
          href="/"
          className="text-white text-lg font-semibold hover:text-amber-400 transition-colors"
        >
          Home
        </Link>

        {/* Category Links */}
        <div className="flex space-x-4">
          <Link
            href="/category/appetizers"
            className={`text-white hover:text-amber-400 transition-colors ${
              currentCategory === "appetizers" ? "font-bold underline" : ""
            }`}
          >
            Appetizers
          </Link>
          <Link
            href="/category/main-dishes"
            className={`text-white hover:text-amber-400 transition-colors ${
              currentCategory === "main-dishes" ? "font-bold underline" : ""
            }`}
          >
            Main Dishes
          </Link>
          <Link
            href="/category/desserts"
            className={`text-white hover:text-amber-400 transition-colors ${
              currentCategory === "desserts" ? "font-bold underline" : ""
            }`}
          >
            Desserts
          </Link>
          <Link
            href="/category/beverages"
            className={`text-white hover:text-amber-400 transition-colors ${
              currentCategory === "beverages" ? "font-bold underline" : ""
            }`}
          >
            Beverages
          </Link>
        </div>
      </div>
    </nav>
  );
}
