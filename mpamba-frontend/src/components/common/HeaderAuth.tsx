
import Image from "next/image";
import iconMpamba from "@/assets/images/icon/icon.png";

interface HeaderAuthProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
}

export default function HeaderAuth({ title, description }: HeaderAuthProps) {
    return (
         <div className="flex flex-col items-center gap-1.5 px-6 pt-2 pb-4">
            <Image 
                src={iconMpamba} 
                alt="Mpamba Logo" 
                width={80} 
                height={80} 
                className="mb-2" 
                style={{ height: 'auto' }}
                priority
            />
            <h1 className="text-xl font-extrabold text-foreground">
                {title || "Bem-vindo de volta!"}
            </h1>
            <p className="text-muted-foreground text-center text-sm">
                {description || "Entre com suas credenciais para continuar."}
            </p>
        </div>
    );
}