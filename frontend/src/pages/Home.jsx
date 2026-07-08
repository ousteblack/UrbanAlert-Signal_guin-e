import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "./Home/Hero";
import StatsSection from "./Home/StatsSection";
import MapPreview from "./Home/MapPreview";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <StatsSection />
        <MapPreview />
        
        {/* Additional Call to Action Section */}
        <section className="py-24 bg-gradient-to-br from-primary-dark to-primary text-white text-center relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Prêt à améliorer votre ville ?</h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Rejoignez des milliers de citoyens qui utilisent déjà Signal_guinee pour rendre leur environnement plus sûr et plus agréable.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/login" state={{ isRegister: true }} className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                Créer un compte gratuit
              </Link>
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
