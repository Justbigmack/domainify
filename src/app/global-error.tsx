'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const GlobalError = ({ reset }: GlobalErrorProps) => (
  <html lang="en">
    <body>
      <main>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Try again, or reload the page.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </main>
    </body>
  </html>
)

export default GlobalError
