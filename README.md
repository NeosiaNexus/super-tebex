# @neosia-core/super-tebex

SDK Tebex permettant une intégration facile dans un environnement React/Next.js. Cette bibliothèque fournit des hooks React et des stores Zustand pour gérer facilement les catégories, paniers et la création de commandes Tebex.

## 📦 Installation

```bash
npm install @neosia-core/super-tebex
# ou
yarn add @neosia-core/super-tebex
# ou
pnpm add @neosia-core/super-tebex
```

### Peer Dependencies

Cette bibliothèque nécessite les dépendances suivantes :

- `react` ^18.3.1
- `react-dom` ^18.3.1
- `zustand` ^5.0.6
- `sonner` ^2.0.6
- `tebex_headless` ^1.15.1

```bash
npm install zustand sonner tebex_headless
```

## 🚀 Initialisation dans Next.js

### 1. Configuration initiale

Créez un fichier de configuration (ex: `lib/tebex.ts`) :

```typescript
import { initTebex, initShopUrls } from '@neosia-core/super-tebex';

// Initialiser Tebex avec votre clé publique
export function initializeTebex() {
  const publicKey = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error('NEXT_PUBLIC_TEBEX_PUBLIC_KEY is not defined');
  }

  // Initialiser l'instance Tebex
  initTebex(publicKey);

  // Initialiser les URLs du shop (utilisées pour la création de panier)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://votre-domaine.com';
  
  initShopUrls(baseUrl, {
    complete: '/shop/complete-purchase',  // Optionnel, défaut: /shop/complete-purchase
    cancel: '/shop/cancel-purchase',      // Optionnel, défaut: /shop/cancel-purchase
  });
}
```

### 2. Initialisation dans `app/layout.tsx` (App Router)

```typescript
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { initializeTebex } from '@/lib/tebex';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTebex();
  }, []);

  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

### 3. Initialisation dans `pages/_app.tsx` (Pages Router)

```typescript
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { initializeTebex } from '@/lib/tebex';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initializeTebex();
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  );
}
```

## 📚 Hooks disponibles

### `useBasket`

Hook principal pour gérer le panier d'achat.

```typescript
import { useBasket } from '@neosia-core/super-tebex';

function BasketComponent() {
  // Le username peut venir du store global ou être passé directement
  const username = useShopUserStore(s => s.username);
  const { basket, loading, error, addPackageToBasket, removePackageFromBasket, refetch } = useBasket(username);

  if (loading) {
    return <div>Chargement du panier...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  if (!basket) {
    return <div>Votre panier est vide</div>;
  }

  return (
    <div>
      <h2>Votre panier</h2>
      <ul>
        {basket.packages.map(pkg => (
          <li key={pkg.id}>
            {pkg.name} - Quantité: {pkg.in_basket.quantity}
            <button onClick={() => removePackageFromBasket(pkg.id)}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => addPackageToBasket(123, 1)}>
        Ajouter un article
      </button>
    </div>
  );
}
```

#### API

```typescript
interface UseBasketResult {
  basket: Basket | null;          // Panier actuel
  loading: boolean;                // État de chargement
  error: Error | null;             // Erreur éventuelle
  addPackageToBasket: (
    packageId: number,
    quantity?: number,
    type?: PackageType,
    variableData?: Record<string, string>
  ) => Promise<void>;
  removePackageFromBasket: (packageId: number) => Promise<void>;
  updateManualBasket: (basket: Basket | null) => void;
  refetch: () => Promise<void>;
}
```

### `useCategories`

Hook pour récupérer et gérer les catégories de produits.

```typescript
import { useCategories } from '@neosia-core/super-tebex';

function CategoriesComponent() {
  const { categories, loading, error, getByName, refetch } = useCategories({
    includePackages: true,
  });

  if (loading) {
    return <div>Chargement des catégories...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  return (
    <div>
      <h2>Catégories</h2>
      <button onClick={() => refetch()}>Actualiser</button>
      <ul>
        {categories?.map(category => (
          <li key={category.id}>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### API

```typescript
interface UseCategoriesResult {
  categories: Category[] | null;
  loading: boolean;
  error: Error | null;
  getByName: (name: string) => Category | undefined;
  refetch: () => Promise<void>;
}
```

### `useCreateBasket`

Hook pour créer un nouveau panier (utilisé en interne par `useBasket`).

```typescript
import { useCreateBasket } from '@neosia-core/super-tebex';

function CreateBasketButton() {
  const username = useShopUserStore(s => s.username);
  const createBasket = useCreateBasket(username);

  const handleCreate = async () => {
    const basket = await createBasket();
    if (basket) {
      console.log('Panier créé:', basket.ident);
    }
  };

  return <button onClick={handleCreate}>Créer un panier</button>;
}
```

## 🗄️ Stores Zustand

### `useShopUserStore`

Store pour gérer le nom d'utilisateur (persisté dans localStorage).

```typescript
import { useShopUserStore } from '@neosia-core/super-tebex';

function UserProfile() {
  const username = useShopUserStore(s => s.username);
  const setUsername = useShopUserStore(s => s.setUsername);
  const clearUsername = useShopUserStore(s => s.clearUsername);

  return (
    <div>
      {username ? (
        <>
          <p>Connecté en tant que: {username}</p>
          <button onClick={clearUsername}>Déconnexion</button>
        </>
      ) : (
        <button onClick={() => setUsername('Player123')}>Se connecter</button>
      )}
    </div>
  );
}
```

### `useShopBasketStore`

Store pour gérer l'identifiant du panier (persisté dans localStorage).

```typescript
import { useShopBasketStore } from '@neosia-core/super-tebex';

function BasketStatus() {
  const basketIdent = useShopBasketStore(s => s.basketIdent);
  const clearBasketIdent = useShopBasketStore(s => s.clearBasketIdent);

  return (
    <div>
      {basketIdent ? (
        <>
          <p>Panier actif: {basketIdent}</p>
          <button onClick={clearBasketIdent}>Vider le panier</button>
        </>
      ) : (
        <p>Aucun panier actif</p>
      )}
    </div>
  );
}
```

### `useShopUiStore`

Store pour gérer les états d'interface utilisateur (loading, etc.).

```typescript
import { useShopUiStore } from '@neosia-core/super-tebex';

function LoadingIndicator() {
  const isGlobalLoading = useShopUiStore(s => s.isGlobalLoading);
  const isCreatingBasket = useShopUiStore(s => s.isCreatingBasket);

  if (isGlobalLoading || isCreatingBasket) {
    return <div className="spinner">Chargement...</div>;
  }

  return null;
}
```

## 💡 Exemples complets

### Exemple : Page de boutique complète

```typescript
'use client';

import { useCategories, useBasket, useShopUserStore } from '@neosia-core/super-tebex';

export default function ShopPage() {
  const username = useShopUserStore(s => s.username);
  const { categories, loading: categoriesLoading } = useCategories({ includePackages: true });
  const { basket, loading: basketLoading, addPackageToBasket, removePackageFromBasket } = useBasket(username);

  if (categoriesLoading || basketLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="shop-container">
      <aside>
        <h2>Panier</h2>
        {basket ? (
          <ul>
            {basket.packages.map(pkg => (
              <li key={pkg.id}>
                {pkg.name} x{pkg.in_basket.quantity}
                <button onClick={() => removePackageFromBasket(pkg.id)}>Retirer</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Panier vide</p>
        )}
      </aside>

      <main>
        <h1>Boutique</h1>
        {categories?.map(category => (
          <section key={category.id}>
            <h2>{category.name}</h2>
            {category.packages?.map(pkg => (
              <div key={pkg.id} className="product-card">
                <h3>{pkg.name}</h3>
                <p>{pkg.description}</p>
                <p className="price">{pkg.price.display}</p>
                <button 
                  onClick={() => addPackageToBasket(pkg.id, 1)}
                  disabled={!username}
                >
                  Ajouter au panier
                </button>
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
```

### Exemple : Composant de connexion avec gestion d'utilisateur

```typescript
'use client';

import { useState } from 'react';
import { useShopUserStore, useBasket } from '@neosia-core/super-tebex';

export default function LoginForm() {
  const [input, setInput] = useState('');
  const username = useShopUserStore(s => s.username);
  const setUsername = useShopUserStore(s => s.setUsername);
  const clearUsername = useShopUserStore(s => s.clearUsername);
  const { basket, refetch } = useBasket(username);

  const handleLogin = () => {
    if (input.trim()) {
      setUsername(input.trim());
      // Recharger le panier après connexion
      setTimeout(() => refetch(), 100);
    }
  };

  const handleLogout = () => {
    clearUsername();
    setInput('');
  };

  if (username) {
    return (
      <div>
        <p>Connecté: {username}</p>
        {basket && <p>Articles dans le panier: {basket.packages.length}</p>}
        <button onClick={handleLogout}>Déconnexion</button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Nom d'utilisateur"
      />
      <button onClick={handleLogin}>Se connecter</button>
    </div>
  );
}
```

## 🔔 Notifications (Toasts)

La bibliothèque utilise `sonner` pour afficher des notifications. Assurez-vous d'avoir le composant `<Toaster />` dans votre application (voir section Initialisation).

Les notifications sont automatiquement affichées pour :
- Ajout/suppression d'articles au panier
- Erreurs lors de la création du panier
- Erreurs de connexion

## 📝 Types TypeScript

Tous les types sont exportés depuis la bibliothèque :

```typescript
import type { Basket, Category, Package, PackageType } from '@neosia-core/super-tebex';
```

## 🐛 Gestion des erreurs

Tous les hooks retournent un objet `error` que vous pouvez vérifier :

```typescript
const { basket, error, loading } = useBasket(username);

useEffect(() => {
  if (error) {
    console.error('Erreur panier:', error);
    // Gérer l'erreur (afficher un message, logger, etc.)
  }
}, [error]);
```

## 🔄 Persistance

Les stores `useShopUserStore` et `useShopBasketStore` sont automatiquement persistés dans le `localStorage`, permettant de conserver l'état entre les sessions.

## 📚 API Reference

Pour plus de détails sur les types et interfaces, consultez les définitions TypeScript dans `dist/index.d.ts`.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
