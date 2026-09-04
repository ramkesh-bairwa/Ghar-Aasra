import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProperties from "@/components/FeaturedProperties";
import WhyChooseUs from "@/components/WhyChooseUs";
import LocationsGrid from "@/components/LocationsGrid";
import NewProjects from "@/components/NewProjects";
import FeaturedAgents from "@/components/FeaturedAgents";
import MortgageCalculator from "@/components/MortgageCalculator";
import Testimonials from "@/components/Testimonials";
import NewsSection from "@/components/NewsSection";
import NewsletterBanner from "@/components/NewsletterBanner";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import {
  listProperties,
  listLocations,
  listProjects,
  listDevelopers,
  listAgents,
  listBlogPosts,
} from "@/lib/queries";

export default async function HomePage() {
  const [saleProperties, rentProperties, trendingProperties, exclusiveProperties, locations, projects, developers, agents, posts] =
    await Promise.all([
      listProperties({ listingType: "sale", featured: true, limit: 4 }),
      listProperties({ listingType: "rent", featured: true, limit: 4 }),
      listProperties({ limit: 4 }),
      listProperties({ featured: true, limit: 4 }),
      listLocations(),
      listProjects(),
      listDevelopers(),
      listAgents(),
      listBlogPosts(),
    ]);

  return (
    <>
      <Header transparent />
      <main>
        <Hero />
        <StatsBar />
        <CategoryGrid />
        <FeaturedProperties saleProperties={saleProperties} rentProperties={rentProperties} />
        <FeaturedProperties title="Trending properties" subtitle="The homes people are viewing right now." saleProperties={trendingProperties} showModeToggle={false} />
        <FeaturedProperties title="Exclusive properties" subtitle="Private-market opportunities, selected for Flex Home." saleProperties={exclusiveProperties} showModeToggle={false} />
        <WhyChooseUs />
        <LocationsGrid locations={locations.slice(0, 5)} />
        <NewProjects projects={projects.slice(0, 3)} developers={developers} locations={locations} />
        <FeaturedAgents agents={agents.slice(0, 4)} />
        <div id="mortgage">
          <MortgageCalculator />
        </div>
        <Testimonials />
        <NewsSection posts={posts.slice(0, 4)} />
        <NewsletterBanner />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
