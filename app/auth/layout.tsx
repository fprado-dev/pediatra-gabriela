import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/10 items-center justify-center p-12 relative">
        <div className="max-w-md text-center space-y-10">
          <Image
            src="/full-logo.png"
            alt="Logo"
            width={450}
            height={160}
            style={{ width: 'auto', height: 'auto' }}
            className="mx-auto"
            priority
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Pediatra Gabriela
            </h1>
            <p className="text-muted-foreground text-lg">
              Transforme suas consultas em documentação clínica completa com IA
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 space-y-4">
            <div className="flex justify-start items-start">
              <Image
                src="/full-logo.png"
                alt="Logo"
                width={150}
                height={60}
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pediatra Gabriela</h1>
              <p className="text-sm text-muted-foreground">
                Documentação clínica com IA
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
