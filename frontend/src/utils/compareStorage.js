const KEY = 'compareProductIds'
const MAX_COMPARE = 4

export const getCompareList = () => {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || []
    } catch {
        return []
    }
}

export const isInCompare = (id) => getCompareList().includes(id)

export const toggleCompare = (id) => {
    const list = getCompareList()
    let updated
    if (list.includes(id)) {
        updated = list.filter(x => x !== id)
    } else {
        if (list.length >= MAX_COMPARE) {
            return { list, limitReached: true }
        }
        updated = [...list, id]
    }
    localStorage.setItem(KEY, JSON.stringify(updated))
    return { list: updated, limitReached: false }
}

export const clearCompare = () => localStorage.removeItem(KEY)
