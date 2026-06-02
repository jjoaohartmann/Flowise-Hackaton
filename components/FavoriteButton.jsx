"use client";

import { useFavorites } from "@/lib/FavoritesContext";
import { Heart } from "lucide-react";

export default function FavoriteButton({ id, type, name, data = {} }) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(id, type);

  const handleToggle = () => {
    if (favorite) {
      removeFavorite(id, type);
    } else {
      addFavorite({ id, type, name, data });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-all ${
        favorite
          ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
          : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-400"
      }`}
      aria-label={favorite ? "Remover de favoritos" : "Adicionar aos favoritos"}
      title={favorite ? "Remover favorito" : "Adicionar favorito"}
    >
      <Heart size={20} fill={favorite ? "currentColor" : "none"} />
    </button>
  );
}
