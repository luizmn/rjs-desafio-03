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

  // ___________________BEGIN Stock function____________________
  const [stockLocal, setStockLocal] = useState<Product[]>(() => {
    const storagedStock = localStorage.getItem('@RocketShoes:stock');

      if (storagedStock) {
        return JSON.parse(storagedStock);
      }

      return [];
    });

    // ___________________END Stock function____________________


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
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, addNewProductToCart]))
        } 
      } catch {
        toast.error('Produto sem estoque!'); 
        }
      } else {
        if (stockList.amount > 0 ) {
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
    }

    } catch {
      toast.error('Erro na adição do produto');
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
      toast.error('Erro na remoção do produto');
    }
  };


  const clearCart = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
    toast.error('Erro na limpeza do carrinho!');
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
    
        const updateProductInCart = cart.map(cartItem => cartItem.id === productId ? {
          ...cartItem,
          amount: Number(amount) //+ amount
        } : cartItem);

        setCart(updateProductInCart);
        localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify(updateProductInCart)
        );
      

    } catch {
      toast.error('Erro ao atualizar quantidade!');
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