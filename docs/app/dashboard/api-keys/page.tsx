import {
  APIKeysTable,
  CreateAPIKeyDialog,
} from "@/components/dashboard/api-keys-table";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function APIKeysPage() {
  // Validate the user is logged in
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <CreateAPIKeyDialog />
      </div>
      <APIKeysTable
      // data={[
      //   {
      //     key: "api-key-1",
      //     expires: new Date().getTime() / 1000 + 61, // 1 minute
      //   },
      // ]}
      />
    </div>
  );
}
