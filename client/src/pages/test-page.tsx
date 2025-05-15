import ApiTester from "@/components/test/ApiTester";

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">API Testing Page</h1>
      <ApiTester />
    </div>
  );
}