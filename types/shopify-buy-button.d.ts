// types/shopify-buy-button.d.ts

export {};

type ShopifyBuyUI = {
  createComponent: (
    type: "product",
    config: {
      id: string;
      node: HTMLElement;
      moneyFormat?: string;
      options: Record<string, unknown>;
    }
  ) => void;

  openCart?: () => void;

  components?: {
    cart?: Array<{
      addVariantToCart?: (variantId: string, quantity: number) => Promise<unknown>;
    }>;
  };
};

type ShopifyBuyUIFactory = {
  onReady: (client: unknown) => Promise<ShopifyBuyUI>;
};

declare global {
  interface Window {
    ShopifyBuy?: {
      buildClient: (config: {
        domain: string;
        storefrontAccessToken: string;
      }) => unknown;
      UI?: ShopifyBuyUIFactory;
    };

    __buyButtonUI__?: Promise<ShopifyBuyUI>;
  }
}
