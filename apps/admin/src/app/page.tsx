import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import PhoneShowcaseSection from "@/components/landing/PhoneShowcaseSection";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard/inicio");
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050507] text-white font-sans overflow-x-clip selection:bg-white/20 selection:text-white">
      {/* Background del Hero nítido y ambiental estrictamente en el primer viewport (h-screen) */}
      <div
        className="absolute top-0 left-0 w-full h-screen pointer-events-none select-none z-0 animate-bg-reveal overflow-hidden"
        style={{ animationDelay: "1.6s" }}
      >
        <Image
          src="/shopli-new-hero.webp"
          alt="ShopLI Hero Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Viñeta sutil en bordes para fusionar con el fondo oscuro de lujo */}
        <div className="absolute inset-0 bg-[#050507]/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/70 via-transparent to-[#050507]" />
      </div>

      {/* Navbar Modular */}
      <LandingNavbar />

      {/* Hero Section Modular (con 3D adaptativo en mobile y desktop) */}
      <HeroSection />

      {/* Sección Showcase iPhone 16 con Demo de POS */}
      <PhoneShowcaseSection />
    </div>
  );
}

