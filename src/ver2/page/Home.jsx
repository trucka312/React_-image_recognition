import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import boy from "../components/image/nam1.png";
import girl from "../components/image/nu1.png";
import { BsFillHeartFill } from "react-icons/bs";
import ReactLoading from "react-loading";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  loadModels,
  getFullFaceDescription,
  createMatcher,
} from "../api/face";

function Home() {
  const Api_key = "4b92af7f16b0fb074cc5e1c7adfa512a";
  const server = "http://14.225.7.221:9090/getdata";

  const [data, setData] = useState([]);
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [link, setLink] = useState(null);
  const navigate = useNavigate();
  const [faceMatcher, setFaceMatcher] = useState(null);

  const uploadImage = async (image, setImage) => {
    const formData = new FormData();
    formData.append("image", image);
    try {
      if (image) {
        const input = document.getElementById(
          setImage === setImage1 ? "male" : "female"
        );
        if (input) {
          input.style.display = "none";
        }
        const apiResponse = await axios.post(
          `https://api.imgbb.com/1/upload?key=${Api_key}`,
          formData
        );
        setImage(apiResponse.data.data.url);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleChangeImage = async (event, setImage) => {
    event.preventDefault();
    let file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (setImage === setImage1) {
          setImage1(e.target.result);
        } else {
          setImage2(e.target.result);
        }
      };
      reader.readAsDataURL(file);
      setImage(file);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await uploadImage(image1, setImage1);
      await uploadImage(image2, setImage2);

      if (!image1 || !image2) {
        toast.error("Bạn phải chọn cả hai ảnh");
        setIsLoading(false);
        return;
      }

      const [face1Desc, face2Desc] = await Promise.all([
        getFullFaceDescription(image1),
        getFullFaceDescription(image2),
      ]);

      if (face1Desc.length === 0 || face2Desc.length === 0) {
        toast.error("Bạn phải chọn ảnh có khuôn mặt");
        setIsLoading(false);
        return;
      }

      if (!faceMatcher) {
        const faceProfile = require("../descriptors/bnk48.json");
        const matcher = await createMatcher(faceProfile);
        setFaceMatcher(matcher);
      }

      const [face1Match, face2Match] = await Promise.all([
        face1Desc.map((descriptor) => faceMatcher.findBestMatch(descriptor)),
        face2Desc.map((descriptor) => faceMatcher.findBestMatch(descriptor)),
      ]);

      if (
        face1Match.some((match) => match.label === "unknown") ||
        face2Match.some((match) => match.label === "unknown")
      ) {
        toast.error("Bạn phải chọn ảnh có khuôn mặt");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${server}`,
        {},
        {
          headers: {
            Link_img1: image1,
            Link_img2: image2,
          },
        }
      );

      setData(response.data);
      setLink(response.data.id);
      setIsLoading(false);
      toast.success("Upload và lưu dữ liệu thành công");
      navigate("/" + response.data.json2[0].id_toan_bo_su_kien);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const renderLoading = () => {
    if (isLoading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "right",
            alignItems: "center",
          }}
        >
          <ReactLoading type={"bars"} color={"#C0C0C0"} />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen min-h-screen p-10 bg-gradient-to-r from-custom-pink to-custom-red ">
      <Header />

      <div className="relative flex flex-row items-center content-center h-4/5 justify-evenly top-32">
        <div className="relative flex flex-col items-center">
          <img src={boy} alt="" className="static w-300 h-500" />
          <input
            onChange={(e) => handleChangeImage(e, setImage1)}
            style={{ backgroundImage: `url(${image1})` }}
            type="file"
            className="w-[360px] h-[360px]  rounded-[50%] absolute bottom-8 left-8 z-10 bg-center bg-no-repeat bg-cover bg-[#FFDAB9]"
          />
          {image1 &&
            !isLoading &&
            faceMatcher &&
            faceMatcher.matchDescriptors.length === 0 && (
              <p className="mt-2 text-sm text-red-500">
                Bạn phải chọn ảnh có khuôn mặt
              </p>
            )}
        </div>

        <div className="flex flex-col items-center transition-transform duration-300 hover:scale-125 ">
          <BsFillHeartFill className="w-48 h-48 text-[#FF9F9F] " />
          <span
            onClick={fetchData}
            className={`text-4xl font-bold mt-14 absolute text-[#7A1E3E] ${
              image1 && image2 && faceMatcher
                ? faceMatcher.matchDescriptors.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            Bắt đầu
          </span>
        </div>
        <div className="relative flex flex-col items-center">
          <img src={girl} alt="" className="static w-500 h-500" />
          <input
            onChange={(e) => handleChangeImage(e, setImage2)}
            style={{ backgroundImage: `url(${image2})` }}
            type="file"
            className="w-[360px] h-[360px]  rounded-[50%] absolute top-8 right-8  z-10 bg-center bg-no-repeat bg-cover bg-[#FFDAB9] "
          />
          {image2 &&
            !isLoading &&
            faceMatcher &&
            faceMatcher.matchDescriptors.length === 0 && (
              <p className="mt-2 text-sm text-red-500">
                Bạn phải chọn ảnh có khuôn mặt
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

export default Home;