import {axiosi} from '../../config/axios'


export const createOrder=async(order)=>{
    try {
        const res=await axiosi.post("/orders",order)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getOrderByUserId=async(id)=>{
    try {
        const res=await axiosi.get(`/orders/user/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getAllOrders=async()=>{
    try {
        const res=await axiosi.get(`/orders`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const updateOrderById=async(update)=>{
    try {
        const res=await axiosi.patch(`/orders/${update._id}`,update)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getOrderAnalytics=async()=>{
    try {
        const res=await axiosi.get(`/orders/analytics`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const downloadInvoice=async(orderId)=>{
    const res=await axiosi.get(`/orders/${orderId}/invoice`,{responseType:'blob'})
    const url=window.URL.createObjectURL(new Blob([res.data]))
    const link=document.createElement('a')
    link.href=url
    link.setAttribute('download',`invoice-${orderId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}