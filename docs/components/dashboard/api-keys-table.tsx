"use client";

import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";
import { z } from "zod";
import { Badge } from "../ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { CopyIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useState } from "react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
}

export const APIKeySchema = z.object({
  token: z.string(),
  sub: z.string(),
  exp: z.number(),
});

export const ErrorResponseSchema = z.object({
  message: z.string(),
});

export const GetAPIKeysResponseSchema = z.object({
  tokens: z.array(APIKeySchema),
});

export const CreateAPIKeyResponseSchema = z.object({
  message: z.string().optional(),
  token: z.string(),
  tokens: z.array(APIKeySchema),
});

export const DeleteAPIKeyResponseSchema = z.object({
  message: z.string().optional(),
  token: z.string(),
  tokens: z.array(APIKeySchema),
});

export type APIKey = z.infer<typeof APIKeySchema>;

function CopyButton({
  token,
  withText = false,
  className,
}: {
  token: string;
  withText?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="secondary"
      size={withText ? "default" : "icon"}
      onClick={() => {
        navigator.clipboard.writeText(token);
      }}
      className={className}
    >
      {withText && <p>Copy</p>}
      <CopyIcon className="w-4 h-4" />
    </Button>
  );
}

export const columns: ColumnDef<APIKey>[] = [
  {
    accessorKey: "key",
    // header: "Venue",
    header: ({ column }) => <div className="flex items-center gap-2">Key</div>,
    cell: ({ row }) => {
      return (
        <div className="w-full relative flex flex-row items-center">
          <div className="wrap-break-word w-[calc(100%-80px)] truncate">
            {row.original.token}
          </div>
          <CopyButton token={row.original.token} className="absolute right-0" />
        </div>
      );
    },
  },
  {
    accessorKey: "expires",
    header: ({ column }) => (
      <div className="flex items-center gap-2">Expires</div>
    ),
    cell: ({ row }) => {
      const utc0Now = new Date().getTime() / 1000;
      const expires = row.original.exp;
      const isExpired = expires < utc0Now;
      if (isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      return (
        <div className="flex items-center gap-2">
          <span className="hidden md:block">
            Expires in {formatDuration(expires - utc0Now, 0)}
          </span>
          <span className="block md:hidden">
            Exp. in {formatDuration(expires - utc0Now, 1)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: ({ column }) => (
      <div className="flex items-center justify-end gap-2">Actions</div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-row justify-end items-center gap-2">
          <DeleteAPIKeyDialog
            key={row.original.token}
            token={row.original.token}
          />
        </div>
      );
    },
  },
];

const colSpans = [3, 1, 1];

export function APIKeysTable() {
  const { getToken } = useAuth();
  const getTokensQuery = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokens`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        const parsedData = ErrorResponseSchema.parse(data);
        throw new Error(parsedData.message);
      }
      const data = await response.json();
      const parsedData = GetAPIKeysResponseSchema.parse(data);
      return parsedData;
    },
  });

  const table = useReactTable({
    data: getTokensQuery.data?.tokens ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  let elements = null;
  if (getTokensQuery.isLoading) {
    elements = (
      <TableRow>
        <TableCell
          colSpan={colSpans.reduce((acc, curr) => acc + curr, 0)}
          className="h-24 text-center"
        >
          <Skeleton className="h-24 w-full" />
        </TableCell>
      </TableRow>
    );
  } else if (getTokensQuery.isError) {
    elements = (
      <TableRow>
        <TableCell
          colSpan={colSpans.reduce((acc, curr) => acc + curr, 0)}
          className="h-24 text-center"
        >
          Error: {getTokensQuery.error.message}
        </TableCell>
      </TableRow>
    );
  } else if (table.getRowModel().rows?.length) {
    elements = table.getRowModel().rows.map((row) => (
      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
        {row.getVisibleCells().map((cell, index) => (
          <TableCell key={cell.id} colSpan={colSpans[index]}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (!table.getRowModel().rows?.length) {
    elements = (
      <TableRow>
        <TableCell
          colSpan={colSpans.reduce((acc, curr) => acc + curr, 0)}
          className="h-24 text-center"
        >
          No results.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead key={header.id} colSpan={colSpans[index]}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{elements}</TableBody>
        </Table>
      </div>
    </div>
  );
}

export function CreateAPIKeyDialog() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const createAPIKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokens`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await auth.getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        const parsedData = ErrorResponseSchema.parse(data);
        throw new Error(parsedData.message);
      }
      const data = await response.json();
      const parsedData = CreateAPIKeyResponseSchema.parse(data);
      return parsedData;
    },
    onSuccess: (data) => {
      // Update the query cache with the new tokens list (after creation)
      queryClient.setQueryData(["api-keys"], { tokens: data.tokens });
      // Alternatively, you could invalidate to refetch:
      // queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="default"
          onClick={() => {
            createAPIKeyMutation.reset();
          }}
        >
          New Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for your account.
          </DialogDescription>
        </DialogHeader>

        {createAPIKeyMutation.isSuccess && (
          <div className="w-full flex flex-row justify-between items-center gap-2">
            <div className="max-w-80 truncate">
              {createAPIKeyMutation.data.token}
            </div>
            <CopyButton token={createAPIKeyMutation.data.token} withText />
          </div>
        )}
        {createAPIKeyMutation.isError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {createAPIKeyMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="default"
            onClick={() => {
              createAPIKeyMutation.mutate();
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAPIKeyDialog({ token }: { token: string }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const deleteAPIKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tokens/${token}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${await auth.getToken()}`,
          },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        const parsedData = ErrorResponseSchema.parse(data);
        throw new Error(parsedData.message);
      }
      const data = await response.json();
      const parsedData = DeleteAPIKeyResponseSchema.parse(data);
      return parsedData;
    },
    onSuccess: (data) => {
      // Update the query cache with the new tokens list (after deletion)
      queryClient.setQueryData(["api-keys"], { tokens: data.tokens });
      // Alternatively, you could invalidate to refetch:
      // queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          onClick={() => {
            deleteAPIKeyMutation.reset();
          }}
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this API key?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              deleteAPIKeyMutation.mutate();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
