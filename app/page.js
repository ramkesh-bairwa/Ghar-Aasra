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
import AdSlot from "@/components/ads/AdSlot";
import ReelsStrip from "@/components/reels/ReelsStrip";
import LocalitiesStrip from "@/components/localities/LocalitiesStrip";
import {
  listProperties,
  listLocations,
  listProjects,
  listDevelopers,
  listAgents,
  listBlogPosts,
  getAllSiteSettings,
} from "@/lib/queries";

// Featured listings come from the DB; render per request so publishing or
// unpublishing a property shows up immediately instead of at the next build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [saleProperties, rentProperties, trendingProperties, exclusiveProperties, locations, projects, developers, agents, posts, settings] =
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
      getAllSiteSettings(),
    ]);

  // Section visibility and headings come from admin → Site Settings →
  // Homepage sections; only the listings inside are pulled from the DB.
  const show = (id) => settings[`home_${id}_enabled`] !== "false";
  const text = (id) => ({ title: settings[`home_${id}_title`], subtitle: settings[`home_${id}_subtitle`] });
  const whyItems = [1, 2, 3, 4]
    .map((i) => ({ title: settings[`why_item_${i}_title`], body: settings[`why_item_${i}_body`] }))
    .filter((item) => item.title);

  return (
    <>
      <Header transparent />
      <main>
        <Hero />
        {show("stats") && <StatsBar />}
        <AdSlot placement="home_hero_below" wrap />
        {show("categories") && <CategoryGrid {...text("categories")} />}
        {show("featured") && <FeaturedProperties {...text("featured")} saleProperties={saleProperties} rentProperties={rentProperties} />}
        {show("trending") && <FeaturedProperties {...text("trending")} saleProperties={trendingProperties} showModeToggle={false} />}
        {show("exclusive") && <FeaturedProperties {...text("exclusive")} saleProperties={exclusiveProperties} showModeToggle={false} />}
        {show("reels") && settings.reels_enabled !== "false" && <ReelsStrip {...text("reels")} />}
        {show("why") && <WhyChooseUs {...text("why")} items={whyItems} />}
        <AdSlot placement="home_middle" wrap />
        {show("locations") && <LocationsGrid {...text("locations")} locations={locations.slice(0, 5)} />}
        {show("localities") && <LocalitiesStrip {...text("localities")} />}
        {show("projects") && <NewProjects {...text("projects")} projects={projects.slice(0, 3)} developers={developers} locations={locations} />}
        {show("agents") && <FeaturedAgents {...text("agents")} agents={agents.slice(0, 4)} />}
        {show("mortgage") && (
          <div id="mortgage">
            <MortgageCalculator {...text("mortgage")} />
          </div>
        )}
        {show("testimonials") && <Testimonials {...text("testimonials")} />}
        {show("news") && (
          <NewsSection
            {...text("news")}
            posts={posts.slice(0, Math.min(20, Math.max(1, Number(settings.home_news_count) || 8)))}
            autoplay={settings.home_news_autoplay !== "false"}
          />
        )}
        {show("newsletter") && <NewsletterBanner {...text("newsletter")} />}
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
