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
      // const [ product ] = await Promise.all([api.get<Product>(`products/${productId}`)])

      const [product, stock] = await Promise.all([
        api.get(`products/${productId}`),
        api.get(`stock/${productId}`)

      ]);

      const { data: productList} = product;
      const productExistIncCart = cart.find(product => product.id === productId);
      if (!productExistIncCart) {
        const addNewProductToCart = {
          ...productList,
          amount: 1,
        }
        setCart([...cart, addNewProductToCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, addNewProductToCart]))
      } else {
        const updateProductInCart = cart.map(cartItem => cartItem.id === productId ? {
          ...cartItem,
          amount: Number(cartItem.amount) + 1
        } : cartItem);

        setCart(updateProductInCart);
        localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify(updateProductInCart)
        );
      }

        
    } catch {
      console.log("carrinho vazio!");
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
    } catch {
      // TODO
    }
  };


  const clearCart = () => {
    console.log("Cleaning cart!");
    localStorage.clear();
    window.location.reload();
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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