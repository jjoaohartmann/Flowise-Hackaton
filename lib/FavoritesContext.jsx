"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const FavoritesContext = createContext({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
});

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Carregar favoritos do localStorage ao montar
  useEffect(() => {
    if (user) {
      const storageKey = `flowise-favorites-${user.uid}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar favoritos:", e);
          setFavorites([]);
        }
      }
    }
    setMounted(true);
  }, [user]);

  // Salvar favoritos no localStorage sempre que mudarem
  useEffect(() => {
    if (mounted && user) {
      const storageKey = `flowise-favorites-${user.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    }
  }, [favorites, mounted, user]);

  const addFavorite = (item) => {
    // item deve ter: { id, type, name, data? }
    // type pode ser: "psychologist", "plan", "routine", "article", etc
    const exists = favorites.some((fav) => fav.id === item.id && fav.type === item.type);
    if (!exists) {
      setFavorites([...favorites, { ...item, addedAt: new Date().toISOString() }]);
    }
  };

  const removeFavorite = (id, type) => {
    setFavorites(favorites.filter((fav) => !(fav.id === id && fav.type === type)));
  };

  const isFavorite = (id, type) => {
    return favorites.some((fav) => fav.id === id && fav.type === type);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
