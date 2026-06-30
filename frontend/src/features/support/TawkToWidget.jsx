import { useEffect } from 'react'

// Loads the Tawk.to live chat widget once REACT_APP_TAWKTO_ID is set in
// frontend/.env (get a free property ID from https://www.tawk.to). Renders
// nothing — Tawk.to injects its own floating chat bubble into the page.
export const TawkToWidget = () => {
    useEffect(() => {
        const tawkToId = process.env.REACT_APP_TAWKTO_ID
        if (!tawkToId || document.getElementById('tawkto-script')) return

        const script = document.createElement('script')
        script.id = 'tawkto-script'
        script.async = true
        script.src = `https://embed.tawk.to/${tawkToId}/default`
        script.charset = 'UTF-8'
        script.setAttribute('crossorigin', '*')
        document.body.appendChild(script)
    }, [])

    return null
}
