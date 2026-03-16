import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
      console.error("Profile creation error:", error);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center">
            <User className="w-8 h-8 text-black" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Let's set up your profile to get started
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-foreground"
                disabled={saveProfile.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? "Creating Profile..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
