import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import LandingPage from "../components/client/landingpage";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="pt-16">
        <LandingPage />
      </main>

      <Footer />
    </>
  );
}