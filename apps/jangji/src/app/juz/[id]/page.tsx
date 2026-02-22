import JuzReader from "@/components/JuzReader";

export async function generateStaticParams() {
    return Array.from({ length: 30 }, (_, i) => ({
        id: (i + 1).toString(),
    }));
}

export default async function JuzPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
                <JuzReader juzId={parseInt(id)} />
            </div>
        </main>
    );
}
