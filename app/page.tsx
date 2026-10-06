import LandingPage from "../components/LandingPage";

export default function Page(){
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GwenBooks",
    url: "https://gwen-books.vercel.app/",
    description: "Discover books across legitimate catalogs and read supported public-domain or openly licensed texts.",
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><LandingPage /></>;
}
