import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
      
      if (stockList.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
      throw Error();
      }
      
      const checkCart = cart.find(cartItem => cartItem.id === productId);
    
      if (!checkCart) {
        const addNewProductToCart = {
        ...productList,
        amount: 1,
        }
        setCart([...cart, addNewProductToCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, addNewProductToCart]));
        toast.info("Produto adicionado ao carrinho");
      } else {
          if (stockList.amount > checkCart.amount) {
            const updateProductInCart = cart.map(cartItem => cartItem.id === productId ? {
              ...cartItem,
              amount: Number(cartItem.amount) + 1
            } : cartItem);
    
            setCart(updateProductInCart);
            localStorage.setItem(
              '@RocketShoes:cart', 
              JSON.stringify(updateProductInCart)
            );
            toast.info('Quantidade atualizada no carrinho'); 
          } else {
              toast.error('Quantidade solicitada fora de estoque');
              throw Error();
          }
      }
      } catch {
        toast.error('Erro na adição do produto');
      }
  };

  const removeProduct = async (productId: number) => {
    try {
      const checkCart = cart.find(cartItem => cartItem.id === productId);	
      if (checkCart) {
        const removeProductCart = cart.filter(cartItem => cartItem.id !== productId)
        setCart(removeProductCart);
        localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify(removeProductCart)
        );
        toast.warn("Produto removido do carrinho!");
      } else {
        throw Error();
      }
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
    toast.error('Erro ao esvaziar carrinho!');
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const [stock] = await Promise.all([
        api.get(`stock/${productId}`)
      ]);
  
      const { data: stockList} = stock;

      if (amount <= 0) {
        return;
      }

      if (stockList.amount === 2) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const checkCart = cart.find(cartItem => cartItem.id === productId);	
      

      if (checkCart) {
        if (amount <= stockList.amount) {
        const updateProductInCart = cart.map(cartItem => cartItem.id === productId ? {
          ...cartItem,
          amount: Number(amount)
          } : cartItem);
      
          setCart(updateProductInCart);
          localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify(updateProductInCart)
          );
          toast.info('Quantidade atualizada no carrinho');
        }
        else { 
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
          throw Error();
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