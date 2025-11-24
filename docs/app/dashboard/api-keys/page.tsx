import {
  APIKeysTable,
  CreateAPIKeyDialog,
} from "@/components/dashboard/api-keys-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { RedirectToSignUp } from "@clerk/nextjs";

export default async function APIKeysPage() {
  // Validate the user is logged in
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="flex flex-col gap-4">
        <RedirectToSignUp />
      </div>
    );
    // redirect("/sign-in");
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            asChild
            className="text-left flex flex-row items-center px-2"
          >
            <a
              href="https://fntu-api.benapps.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              <p>API Playground</p>
            </a>
          </Button>
          <CreateAPIKeyDialog />
        </div>
      </div>
      <Alert variant="warning">
        <AlertTitle>Heavy Limitations!</AlertTitle>
        <AlertDescription className="text-xs md:text-sm lg:text-base">
          The playground is intended for experimentation and learning. Please
          self-host for production use.
        </AlertDescription>
      </Alert>
      <APIKeysTable />
    </div>
  );
}
