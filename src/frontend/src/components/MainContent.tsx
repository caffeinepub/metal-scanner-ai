import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, History } from "lucide-react";
import { useState } from "react";
import HistoryTab from "./HistoryTab";
import ScannerTab from "./ScannerTab";

export default function MainContent() {
  const [activeTab, setActiveTab] = useState("scanner");

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger
            value="scanner"
            className="data-[state=active]:bg-gold data-[state=active]:text-black"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scanner
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-gold data-[state=active]:text-black"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6">
          <ScannerTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
