import React from 'react'
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import { useEffect, useState } from 'react';
function Auth({isModel = false}) {
    const dispatch = useDispatch()
    const [errorMsg, setErrorMsg] = useState("")
    const [busy, setBusy] = useState(false)

    const finishLogin = async (User) => {
        const result = await axios.post(
            ServerUrl + "/api/auth/google",
            { name: User.displayName || "User", email: User.email },
            { withCredentials: true }
        )
        dispatch(setUserData(result.data))
    }

    useEffect(() => {
        getRedirectResult(auth)
            .then((response) => {
                if (response?.user) {
                    finishLogin(response.user)
                }
            })
            .catch((error) => {
                setErrorMsg(error?.code || error?.message || "Google sign-in failed")
            })
    }, [])

    const handleGoogleAuth = async () => {
        setErrorMsg("")
        setBusy(true)
        try {
            const response = await signInWithPopup(auth, provider)
            await finishLogin(response.user)
        } catch (error) {
            const code = error?.code || ""
            if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
                await signInWithRedirect(auth, provider)
                return
            }
            if (code === "auth/popup-closed-by-user") {
                setErrorMsg("The Google window was closed. Click Continue with Google again.")
            } else if (code === "auth/unauthorized-domain") {
                setErrorMsg("Add localhost as an authorized domain in Firebase Authentication → Settings.")
            } else if (code === "auth/api-key-not-valid" || code === "auth/invalid-api-key") {
                setErrorMsg("Firebase API key is invalid. Please check your config.")
            } else {
                setErrorMsg(error?.response?.data?.message || error?.message || "Google sign-in failed")
            }
            console.error(error)
        } finally {
            setBusy(false)
        }
    }
  return (
    <div className={`
      w-full 
      ${isModel ? "py-4" : "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"}
    `}>
        <motion.div 
        initial={{opacity:0 , y:-40}} 
        animate={{opacity:1 , y:0}} 
        transition={{duration:1.05}}
        className={`
        w-full 
        ${isModel ? "max-w-md p-8 rounded-3xl" : "max-w-lg p-12 rounded-[32px]"}
        bg-white shadow-2xl border border-gray-200
      `}>
            <div className='flex items-center justify-center gap-3 mb-6'>
                <div className='bg-black text-white p-2 rounded-lg'>
                    <BsRobot size={18}/>

                </div>
                <h2 className='font-semibold text-lg'>InterviewIQ.AI</h2>
            </div>

            <h1 className='text-2xl md:text-3xl font-semibold text-center leading-snug mb-4'>
                Continue with
                <span className='bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2'>
                    <IoSparkles size={16}/>
                    AI Smart Interview

                </span>
            </h1>

            <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
                Sign in to start AI-powered mock interviews,
        track your progress, and unlock detailed performance insights.
            </p>


            {errorMsg && (
                <p className='mb-4 text-center text-sm text-red-600'>{errorMsg}</p>
            )}

            <motion.button 
            onClick={handleGoogleAuth}
            disabled={busy}
            whileHover={{opacity:0.9 , scale:1.03}}
            whileTap={{opacity:1 , scale:0.98}}
            className='w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md disabled:opacity-60'>
                <FcGoogle size={20}/>
                {busy ? "Opening Google..." : "Continue with Google"}

   
            </motion.button>
        </motion.div>

      
    </div>
  )
}

export default Auth
