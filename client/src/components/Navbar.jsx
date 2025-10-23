import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    SignedIn,
    SignedOut,
    UserButton
} from "@clerk/clerk-react";
import Search from "./Search"; 
import ContactForm from "./ContactForm"; 


const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false); // Estado para mostrar/ocultar el formulario
    const location = useLocation();
    const isPostListPage = location.pathname === "/posts";


    // Función para cerrar el menú móvil al hacer clic en un enlace
    const closeMobileMenu = () => {
        setOpen(false);
    };

    // Modificar la función para quitar el disparo del confeti
    const handleLogoClick = () => {
        closeMobileMenu();
    };
    
    // Función para mostrar/ocultar el formulario de contacto
    const toggleContactForm = (e) => {
        e.preventDefault();
        setShowContactForm(!showContactForm);
        closeMobileMenu();
    };

    // Efecto para detectar el scroll y actualizar el estado
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        
        // Limpieza del evento al desmontar el componente
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            <header 
                className={`bg-[#522c45] shadow-md fixed z-50 transition-all duration-300 ease-in-out
                    ${scrolled ? 'rounded-2xl px-4 py-1 top-[10px] mx-auto max-w-[90%] w-[90%] left-0 right-0' : 'top-0 py-1 rounded-none w-full'}
                `}
            >
                <div className={`mx-auto px-4 ${scrolled ? 'max-w-[95%]' : 'container'}`}>
                    {/* Main Header */}
                    <div className={`flex justify-between items-center relative ${scrolled ? 'py-1' : 'py-3'} transition-all duration-300`}>
                        {/* Mobile Menu Button - Izquierda */}
                        <div className="md:hidden order-1">
                            <button
                                onClick={() => setOpen(!open)}
                                className="text-white hover:text-gray-300 focus:outline-none"
                            >
                                {open ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Logo - Centrado en móvil, Izquierda en Desktop */}
                        <div className="flex-1 md:flex-none md:order-1 order-2 flex justify-center md:justify-start">
                            <Link to="/" className="flex items-center" onClick={handleLogoClick}>
                                <img
                                    src="/LogoHIC.png" 
                                    alt="Hospital Infantil de Las Californias"
                                    className={`transition-all duration-300 ${scrolled ? 'h-8 md:h-10' : 'h-12 md:h-14'} mr-2`}
                                />
                            </Link>
                        </div>
                        
                        {/* Desktop Navigation - Modificado para parecerse a la imagen */}
                        <nav className="hidden md:flex flex-grow justify-center items-center space-x-8 order-2 text-white -ml-10">
                            <Link 
                                to="/" 
                                className={`font-medium text-lg tracking-wide transition-colors border-b-2 ${location.pathname === '/' ? 'border-white' : 'border-transparent hover:border-white'} pb-1`}
                            >
                                Inicio
                            </Link>
                            <Link 
                                to="/posts" 
                                className={`font-medium text-lg tracking-wide transition-colors border-b-2 ${location.pathname === '/posts' ? 'border-white' : 'border-transparent hover:border-white'} pb-1`}
                            >
                                Articulos
                            </Link>
                            <a 
                                href="#" 
                                onClick={toggleContactForm}
                                className={`font-medium text-lg tracking-wide transition-colors border-b-2 ${showContactForm ? 'border-white' : 'border-transparent hover:border-white'} pb-1`}
                            >
                                Contacto
                            </a>
                        </nav>

                        {/* Search and User - Derecha */}
                        <div className="flex items-center space-x-4 order-3">
                            {/* Mostrar Search en todas las páginas */}
                            <div className="hidden lg:block">
                                <Search />
                            </div>
                            
                            <SignedOut>
                                <Link to="/login">
                                    <button className={`transition-all duration-300 ${scrolled ? 'py-1 px-3' : 'py-2 px-4'} rounded-3xl bg-white text-[#522c45] hover:bg-gray-100 font-medium transition-colors`}>Login</button>
                                </Link>
                            </SignedOut>
                            <SignedIn>
                                {/* Contenedor para Panel y UserButton */}
                                <div className={`flex items-center space-x-3 bg-white rounded-full transition-all duration-300 ${scrolled ? 'px-2 py-1' : 'px-3 py-1.5'} hover:bg-gray-100`}>
                                    <Link to="/user-articles" className="text-[#522c45] text-sm font-medium whitespace-nowrap hover:underline">Panel</Link>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {open && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4 z-40">
                        <div className="container mx-auto px-4 flex flex-col space-y-3">
                            <Link to="/" className="font-medium text-gray-700 hover:text-[#522c45] py-1" onClick={closeMobileMenu}>Inicio</Link>
                            <Link to="/posts" className="font-medium text-gray-700 hover:text-[#522c45] py-1" onClick={closeMobileMenu}>Articulos</Link>
                            <a href="#" className="font-medium text-gray-700 hover:text-[#522c45] py-1" onClick={toggleContactForm}>Contacto</a>
                            <SignedIn>
                                <Link to="/user-articles" className="font-medium text-gray-700 hover:text-[#522c45] py-1" onClick={closeMobileMenu}>Panel</Link>
                            </SignedIn>
                        </div>
                    </div>
                )}
            </header>
            
            {/* Modal de formulario de contacto */}
            {showContactForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-4xl">
                        <ContactForm onClose={() => setShowContactForm(false)} />
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;