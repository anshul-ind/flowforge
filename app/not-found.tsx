import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'system-ui' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go back to homepage
      </Link>
    </div>
  );
}
