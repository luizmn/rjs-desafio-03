import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
  clearCart: () => void
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

      if (storagedCart) {
        return JSON.parse(storagedCart);
      }

      return [];
    });

  const addProduct = async (productId: number) => {
    try {
      const [product, stock] = await Promise.all([
        api.get(`products/${productId}`),
        api.get(`stock/${productId}`)
      ]);

      const { data: productList} = product;
      const { data: stockList} = stock;
    
      // const verifyStock = stockLocal.map
      
      const productExistInCart = cart.find(product => product.id === productId);
      if (!productExistInCart) {
        try {
          if (stockList.amount > 0) {
          const addNewProductToCart = {
          ...productList,
          amount: 1,
          }
          setCart([...cart, addNewProductToCart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, addNewProductToCart]));
          toast.info("Produto adicionado ao carrinho!");
        } else {
          toast.error('Produto sem estoque!'); 
        }
      } catch {
        toast.error('Erro ao adicionar produto!'); 
        }
      } else {
        if (stockList.amount > 0 && stockList.amount > productExistInCart.amount) {
        const updateProductInCart = cart.map(cartItem => cartItem.id === productId ? {
          ...cartItem,
          amount: Number(cartItem.amount) + 1
        } : cartItem);

        setCart(updateProductInCart);
        localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify(updateProductInCart)
        );
        toast.info("Produto adicionado ao carrinho!");
        } else {
          toast.error('Erro na adição do produto. Produto sem estoque!');  
        }
      }
    } catch {
      toast.error('Produto sem estoque!');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeProductCart = cart.filter(cartItem => cartItem.id !== productId)
      setCart(removeProductCart);
      localStorage.setItem(
        '@RocketShoes:cart', 
        JSON.stringify(removeProductCart)
      );
      toast.warn("Produto removido do carrinho!");
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };


  const clearCart = () => {
    try {
      localStorage.clear();
      window.location.reload();
      toast.info("Carrinho vazio!")
    } catch {
    toast.error('Erro na limpeza do carrinho!');
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {


    const [stock] = await Promise.all([
      api.get(`stock/${productId}`)
    ]);

    const { data: stockList} = stock;

    const checkCart = cart.find(cartItem => cartItem.id === productId);

    try {
      if (amount <= stockList.amount && stockList.amount >= checkCart!.amount) {
    const updateProductInCart = cart.map(cartItem => cartItem.id === productId ? {
          ...cartItem,
          amount: Number(amount)
        } : cartItem);

        setCart(updateProductInCart);
        localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify(updateProductInCart)
        );
        toast.info("Quantidade atualizada no carrinho!");
      }
      else { 
        toast.error('Produto sem estoque!!');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}