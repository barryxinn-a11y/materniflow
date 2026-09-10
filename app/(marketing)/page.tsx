import { Metadata } from "next"
import { generateSEOMetadata } from "@/lib/seo/generateMetadata"
import HomePageContent from "./HomePageContent"

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Materniflow - AI Powered OB/GYN Operation Assistant",
    description: "An intelligent AI agent that helps healthcare staff manage obstetrics and gynecology ward operations through natural language conversations. Built as a hands-on learning project for AI Agent development.",
    keywords: [
      "AI",
      "AI Agent",
    ],
    url: "",
    ogTitle: "Materniflow - AI Powered OB/GYN Operation Assistant",
    ogDescription: "An intelligent AI agent that helps healthcare staff manage obstetrics and gynecology ward operations through natural language conversations. Built as a hands-on learning project for AI Agent development.",
    imageAlt: "Materniflow - AI Powered OB/GYN Operation Assistant",
    twitterTitle: "Materniflow - AI Powered OB/GYN Operation Assistant",
    twitterDescription: "An intelligent AI agent that helps healthcare staff manage obstetrics and gynecology ward operations through natural language conversations. Built as a hands-on learning project for AI Agent development.",
  })
}

export default function HomePage() {
  return <HomePageContent />
}
