import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TaskProvider } from "../components/client/TaskContext";
import AppLayout from "../components/client/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EZTrackly",
  description: "Task Management System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TaskProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </TaskProvider>
      </body>
    </html>
  );
}