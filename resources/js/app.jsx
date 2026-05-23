import './bootstrap';
import '../css/app.css';
import '../css/global.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './axiosConfig'; 
import ReactDOM from 'react-dom/client';
import Home from './components/home/home';
import ListadoProductos from './components/listadoProductos/listadoProductos';
import DetalleProductos from './components/detalleProducto/detalleProducto';
import UserPanel from './components/userPanel/userPanel';
import AdminPanel from './components/adminPanel/adminPanel';
import LoginPage from './components/loginPage/loginPage';
import RegisterPage from './components/registrerPage/registrerPage';
import ShoppingCart from './components/shoppingCart/shoppingCart';
import ContactPage from './components/contact/contact';
import AboutUs from './components/aboutUs/aboutUs';
import Error404 from './components/error404/error404';
import { AuthProvider } from './components/RUTAS/AuthContext';
import PrivateRoute from './components/RUTAS/PrivateRoute';
import VerifyEmailPage from './components/verificarEmail/verifyEmailPage';
import ForgotPasswordPage from './components/forgotPasswordPage/forgotPasswordPage';
import Checkout from './components/checkout/checkout';

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<ListadoProductos />} />
          <Route path="/producto/:id" element={<DetalleProductos />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Rutas protegidas */}
          <Route 
            path="/userPanel" 
            element={
              <PrivateRoute>
                <UserPanel />
              </PrivateRoute>
            } 
          />

          <Route 
          path="/adminPanel" 
          element={
            <PrivateRoute adminOnly={true}>
              <AdminPanel />
            </PrivateRoute>
          } />

          <Route 
          path="/checkout" 
          element={
            <PrivateRoute>
              <Checkout />
             </PrivateRoute>
          } 
          />
          <Route path="*" element={<Error404/>} />
          <Route path='/shoppingCart' element={<ShoppingCart />} />
          <Route path='/contact' element={<ContactPage />} />
          <Route path='/aboutUs' element={<AboutUs />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;