import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import LoanCalculatorPro from "@/components/LoanCalculatorPro";

export const metadata = { title: "Loan Calculator" };

export default function LoanCalculatorPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Plan ahead"
          title="Loan calculator"
          subtitle="Model your real monthly payment — principal, interest, taxes, insurance, and payoff strategy — before you tour a place."
        />
        <LoanCalculatorPro />
      </main>
      <Footer />
    </>
  );
}
