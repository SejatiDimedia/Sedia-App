import JuzReader from "@/components/JuzReader";

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
