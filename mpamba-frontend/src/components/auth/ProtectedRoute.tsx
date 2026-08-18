'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import icon from '@/assets/images/icon/icon4.png';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, accessToken, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            // If not authenticated or no token, redirect to signin
            if (!isAuthenticated || !accessToken) {
                console.log('[ProtectedRoute] Redirecting to signin - Not authenticated');
                router.push('/signin');
            }
        }
    }, [isAuthenticated, accessToken, isMounted, router]);

    // Prevent hydration mismatch and show loader while checking
    if (!isMounted || !isAuthenticated || !accessToken) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 size={40} className="text-primary animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Verificando sessão...
                </p>
            </div>
        );
    }

    return (
        <>
            {user && !user.onboardingCompletedAt && <OnboardingModal />}
            {children}
        </>
    );
}
