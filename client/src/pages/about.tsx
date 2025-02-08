import { Fragment } from "react";
import LandingHeader from "@/components/landing-header";
import Footer from "@/components/footer";

export default function AboutPage() {
  return (
    <Fragment>
      <LandingHeader />
      <main className="container py-12 max-w-4xl bg-cream"> {/* Added background color */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-center text-primary"> {/* Added text-center and text-primary */}About StackTracker</h1>
          <p className="text-lg">
            Welcome to StackTracker—a friendly yet science-savvy platform designed to help you take control of your well-being. We believe that knowledge is power, especially when it comes to your unique health journey. Whether you're a long-time supplement enthusiast or you're just getting started, StackTracker makes it easy to log, reflect on, and optimize every aspect of your supplement regimen.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-center text-primary"> {/* Added text-center and text-primary */}What StackTracker Does</h2>
          <ul>
            <li><strong>Streamlined Tracking:</strong> StackTracker's intuitive interface lets you record your supplement regimen with just a few taps. Log dosage, frequency, and timing to keep an accurate record of your daily intake.</li>
            <li><strong>Qualitative Insights:</strong> Beyond the numbers, StackTracker helps you capture how your supplements are truly making you feel. From energy levels and mood to sleep quality, you can track it all and watch for patterns over time.</li>
            <li><strong>Intelligent Feedback:</strong> Tap into a customized knowledge base that learns from your personal data. The StackTracker platform takes your unique health info into account so you can ask questions and receive tailored insights that make sense for <em>you</em>—no more one-size-fits-all advice.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 text-center text-primary"> {/* Added text-center and text-primary */}Why It Matters</h2>
          <p>
            When it comes to health, personalization is everything. We're all different, and what works wonders for one person might not work for another. By marrying hard data (like dosage and timing) with your subjective experience (how you feel physically and emotionally), StackTracker gives you the full story behind your supplement use. You'll discover what genuinely benefits you and what might need adjusting.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-center text-primary"> {/* Added text-center and text-primary */}Designed for You</h2>
          <p>
            StackTracker was built with a user-first approach, creating a sleek interface that's easy to navigate on any device. Think of it as your personal supplement journal—always up-to-date, always ready to offer meaningful insights. Whether you're tracking a complex regimen or experimenting with a single new supplement, StackTracker's flexible features adapt to your style.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-center text-primary"> {/* Added text-center and text-primary */}A Healthy Future</h2>
          <p>
            We're on a mission to transform how people approach their daily wellness routines. By empowering you with actionable insights and individualized feedback, StackTracker simplifies your path to better health. Curious about how a specific supplement affects your sleep, or whether your new workout routine has boosted your energy levels? Simply consult StackTracker's knowledge base for feedback tailored to <em>your</em> history and data.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-center text-primary"> {/* Added text-center and text-primary */}Join the Community</h2>
          <p>
            Your journey doesn't have to be a solo adventure. By using StackTracker, you become part of a community of health-conscious individuals who value scientific curiosity and personal growth. The StackTracker platform is constantly evolving—integrating the latest research, refining technology, and building new tools to deepen your self-discovery.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-center text-primary"> {/* Added text-center and text-primary */}Get Started</h2>
          <p>
            Ready to take the guesswork out of your supplement routine? StackTracker is here to make your health journey smoother, clearer, and more informed. Together, we'll turn data into direction and curiosity into confident progress.
          </p>

          <p>
            We look forward to supporting you every step of the way. Here's to feeling your best, one supplement at a time!
          </p>
        </article>
      </main>
      <Footer />
    </Fragment>
  );
}