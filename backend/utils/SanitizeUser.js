exports.sanitizeUser=(user)=>{
    return {_id:user._id,email:user.email,isVerified:user.isVerified,isAdmin:user.isAdmin,businessId:user.businessId ?? null,role:user.role ?? null}
}