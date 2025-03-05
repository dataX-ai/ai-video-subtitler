// app/app-router-test/page.tsx
// http://localhost:3000/app-router-test
'use client'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '../../components/ui/error-boundary'


export default function ErrorButtons() {
	const [isErrored, setIsErrored] = useState(false)

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: '20rem',
				gridGap: '1rem',
				padding: '2rem',
			}}
		>
			<ErrorBoundary>
				<button
					onClick={() => {
						throw new Error('Threw client-side Error')
					}}
				>
					Throw client-side onClick error
				</button>

				<ThrowerOfErrors isErrored={isErrored} setIsErrored={setIsErrored} />
				<button onClick={() => setIsErrored(true)}>Trigger error boundary</button>
				<button
					onClick={async () => {
						throw new Error('an async error occurred')
					}}
				>
					Trigger promise error
				</button>
			</ErrorBoundary>
		</div>
	)
}

function ThrowerOfErrors({
	isErrored,
	setIsErrored,
}: {
	isErrored: boolean
	setIsErrored: (isErrored: boolean) => void
}) {
	useEffect(() => {
		if (isErrored) {
			setIsErrored(false)
			throw new Error('Threw useEffect error')
		}
	}, [isErrored, setIsErrored])

	return null
}
