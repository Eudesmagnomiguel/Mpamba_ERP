"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getHomePath } from "@/shared/utils/auth.utils";

export default function Home() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        router.replace(getHomePath(user));
    }, [router, user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );
}
