import { useState } from "react";
import OtpInput from "react-otp-input";
import { FaRegEnvelopeOpen, FaSpinner } from "react-icons/fa";
import "./otp-style.css";
import useAuth from "../../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { addToast } from "../../../slices/errorSlice";
import useModal from "../../modal/useModal";
import Modal from "../../modal/Modal";
import { IDBPDatabase } from "idb";

export default function OTPModal({ db, dbReady, email }: { db: IDBPDatabase<unknown> | null, dbReady: boolean, email: string }) {
  const dispatch = useDispatch();
  const { verifyOTP } = useAuth(db, dbReady);
  const [, onDismiss] = useModal(<></>);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = async (otp: string) => {
    setOtp(otp);
    if (otp.length === 6) {
      setLoading(true);

      console.log(otp)
      const success = await verifyOTP(email, otp);
      if (success) onDismiss();
      else {
        dispatch(
          addToast({
            id: Date.now(),
            message: "Invalid code",
            type: "error",
          })
        )

        setOtp("");
      }
      setLoading(false);
    }
  };


  return (
    <Modal className={"p-10 rounded-lg w-[400px] relative bg-white"}>
      <div className="text-center mb-5">
        <FaRegEnvelopeOpen size={50} className="inline-block text-blue-500" />
      </div>
      <div className="text-center mb-3">
        <p>Please enter the code sent to <strong>{email}</strong>, if you don't get the code, also check the <strong>spam</strong> folder</p>
      </div>

      {loading ? (
        <div className="text-center">
          <FaSpinner
            className="animate-spin text-blue-500 inline-block"
            size={50}
          />
        </div>
      ) : (
        <OtpInput
          value={otp}
          onChange={onChange}
          numInputs={6}
          containerStyle="justify-center gap-3"
          inputType="number"
          renderInput={(props) => <input {...props} className="otp-input no-spinners" />}
          inputStyle={{ width: "auto" }}
        />
      )}
    </Modal>
  );
}