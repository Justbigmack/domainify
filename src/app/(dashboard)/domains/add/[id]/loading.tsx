const AddDomainRecordLoading = () => (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 lg:px-10" aria-busy>
    <div className="flex flex-col gap-2">
      <div className="h-5 w-20 rounded-md bg-surface-muted motion-safe:animate-pulse" />
      <div className="h-7 w-40 rounded-md bg-surface-muted motion-safe:animate-pulse" />
    </div>
    <div className="h-14 w-full max-w-md rounded-xl bg-surface-muted motion-safe:animate-pulse" />
    <div className="h-48 rounded-xl bg-surface-muted motion-safe:animate-pulse" />
    <div className="h-32 rounded-xl bg-surface-muted motion-safe:animate-pulse" />
    <p className="text-center text-sm text-ink-muted">Checking your DNS record…</p>
  </div>
)

export default AddDomainRecordLoading
