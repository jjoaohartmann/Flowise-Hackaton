"use client";

import { useFavorites } from "@/lib/FavoritesContext";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Trash2, Heart } from "lucide-react";

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const { favorites, removeFavorite } = useFavorites();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-green-700 dark:border-green-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  // Agrupar favoritos por tipo
  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.type]) acc[fav.type] = [];
    acc[fav.type].push(fav);
    return acc;
  }, {});

  const typeLabels = {
    psychologist: { label: "Psicólogos", icon: "👨‍⚕️" },
    plan: { label: "Planos", icon: "💎" },
    routine: { label: "Rotinas", icon: "📋" },
    article: { label: "Artigos", icon: "📚" },
    exercise: { label: "Exercícios", icon: "🏋️" },
    meditation: { label: "Meditações", icon: "🧘" },
  };

  const handleRemove = (id, type) => {
    removeFavorite(id, type);
  };

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Heart className="text-red-500" size={28} fill="currentColor" />
            Meus Favoritos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {favorites.length} item{favorites.length !== 1 ? "s" : ""} salvo{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-800">
            <Heart size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Nenhum favorito ainda
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              Comece a adicionar itens aos seus favoritos para vê-los aqui!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFavorites).map(([type, items]) => (
              <div key={type} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                {/* Seção Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">{typeLabels[type]?.icon || "⭐"}</span>
                    {typeLabels[type]?.label || type}
                    <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </h2>
                </div>

                {/* Lista de Itens */}
                <div className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                  {items.map((fav) => (
                    <div
                      key={`${fav.id}-${fav.type}`}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {fav.name}
                          </h3>
                          {fav.data && Object.keys(fav.data).length > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {typeof fav.data === "object" &&
                                Object.entries(fav.data).slice(0, 2).map(([key, value]) => (
                                  <p key={key} className="text-xs">
                                    <span className="font-medium capitalize">{key}:</span> {String(value)}
                                  </p>
                                ))}
                            </div>
                          )}
                          {fav.addedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-600 mt-2">
                              Adicionado em {new Date(fav.addedAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>

                        {/* Botão Remover */}
                        <button
                          onClick={() => handleRemove(fav.id, fav.type)}
                          className="ml-4 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Remover favorito"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
