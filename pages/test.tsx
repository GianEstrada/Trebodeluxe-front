import type { NextPage } from "next";

const TestPage: NextPage = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page</h1>
      <p>Si ves esto, Next.js está funcionando correctamente.</p>
      <p>Fecha actual: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestPage;
