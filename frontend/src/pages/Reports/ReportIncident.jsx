import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { FaUpload, FaMapMarkerAlt, FaArrowLeft, FaTimes, FaCrosshairs, FaCamera, FaImage, FaMicrophone, FaStop } from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useGamification } from "../../context/GamificationContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const getSchema = (t) => yup.object({
  category: yup.string().required(t('report.val_category')),
  description: yup.string(),
  location: yup.object().shape({
    lat: yup.number().required(t('report.val_loc_req')),
    lng: yup.number().required(t('report.val_loc_req')),
  }).required(t('report.val_loc_req')),
});

function LocationSelector({ setLocationValue, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || null);
  
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLocationValue("location", { lat: e.latlng.lat, lng: e.latlng.lng }, { shouldValidate: true });
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapController({ center }) {
  const map = useMap();
  if (center) {
    map.flyTo(center, 15);
  }
  return null;
}

export default function ReportIncident() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioInputRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mapCenter, setMapCenter] = useState([9.5350, -13.6773]);
  const [isLocating, setIsLocating] = useState(false);
  const [initialLocation, setInitialLocation] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(getSchema(t))
  });

  // Charger les données de l'incident s'il s'agit d'une modification
  useEffect(() => {
    if (editId) {
      const fetchEditIncident = async () => {
        setIsLoadingEdit(true);
        try {
          const res = await api.get(`/incidents/${editId}`);
          const inc = res.data;
          if (inc) {
            setValue("category", inc.type || "");
            setValue("description", inc.description || "");
            setValue("location", { lat: inc.lat, lng: inc.lng });
            setInitialLocation({ lat: inc.lat, lng: inc.lng });
            setMapCenter([inc.lat, inc.lng]);
            if (inc.photoUrl) {
              setPhotoPreview(inc.photoUrl);
            }
            if (inc.audioUrl) {
              setAudioPreview(inc.audioUrl);
            }
          }
        } catch (err) {
          console.error("Erreur lors de la récupération de l'incident à modifier", err);
          toast.error("Impossible de charger les données du signalement à modifier");
        } finally {
          setIsLoadingEdit(false);
        }
      };
      fetchEditIncident();
    }
  }, [editId, setValue]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isCameraActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error(err);
      toast.error(t('report.err_camera') || "Impossible d'accéder à la caméra");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoPreview(dataUrl);
      setFileType('image/jpeg');
      stopCamera();
    }
  };

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioPreview(reader.result);
        };
        reader.readAsDataURL(audioBlob);
        audioStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioPreview(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Erreur', 'Le fichier audio est trop volumineux (max 10MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const { addPoints } = useGamification();

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        Swal.fire('Erreur', t('report.err_size'), 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFileType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoPreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
          setValue("location", { lat, lng }, { shouldValidate: true });
          setIsLocating(false);
          toast.success(t('report.pos_found'));
        },
        (error) => {
          console.error("GPS Error:", error);
          toast.error(t('report.pos_error'));
          setIsLocating(false);
        }
      );
    } else {
      toast.error(t('report.geo_unsupported'));
      setIsLocating(false);
    }
  };

  const onSubmit = async (data) => {
    if (!data.description?.trim() && !audioPreview) {
      toast.error("Veuillez fournir une description écrite ou enregistrer un message vocal.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: data.category,
        description: data.description || "Message vocal joint",
        lat: data.location.lat,
        lng: data.location.lng,
        location: `GPS: ${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`,
        status: "nouveau",
        authorEmail: user?.email || "anonyme",
        photoUrl: photoPreview,
        audioUrl: audioPreview
      };

      if (editId) {
        // Mode modification : PUT
        await api.put(`/incidents/${editId}`, payload);
        toast.success("Signalement corrigé et renvoyé !");
      } else {
        // Mode création : POST
        await api.post("/incidents", payload);
        addPoints(50);
        toast.success(t('report.points_earned'));
      }
      
      Swal.fire({
        title: editId ? "Correction soumise !" : t('report.success_title'),
        text: editId ? "Votre signalement a été corrigé et renvoyé à l'administration." : t('report.success_text'),
        icon: 'success',
        confirmButtonColor: '#10B981',
        confirmButtonText: editId ? "Voir mes signalements" : t('report.back_home')
      }).then(() => {
        navigate("/my-reports");
      });
    } catch (err) {
      console.error(err);
      toast.error(t('report.err_backend'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-medium mb-8 transition-colors">
          <FaArrowLeft /> {t('report.back_home')}
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-main mb-2">
            {editId ? `Corriger le signalement #INC-${editId}` : t('report.title')}
          </h1>
          <p className="text-text-muted">
            {editId ? "Modifiez ou complétez les informations rejetées ou mal saisies afin de renvoyer le signalement à l'administration." : t('report.subtitle')}
          </p>
        </div>

        <Card className="border-none shadow-lg">
          {isLoadingEdit ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <FaCrosshairs className="text-4xl text-primary animate-spin mb-4" />
              <p className="font-semibold">Chargement des données du signalement...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Informations Générales */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-text-main mb-4 border-b border-slate-100 pb-2">{t('report.step1')}</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-main mb-1">
                        {t('report.incident_type')} <span className="text-danger">*</span>
                      </label>
                      <select 
                        {...register("category")}
                        className={`w-full rounded-lg border ${errors.category ? 'border-danger' : 'border-slate-300'} bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                      >
                        <option value="">{t('report.select_category')}</option>
                        <option value="Infrastructures">{t('report.cat_pothole')}</option>
                        <option value="Éclairage">{t('report.cat_light')}</option>
                        <option value="Propreté">{t('report.cat_clean')}</option>
                        <option value="Espaces verts">{t('report.cat_green')}</option>
                        <option value="Sécurité">{t('report.cat_danger')}</option>
                        <option value="Autre">{t('report.cat_other')}</option>
                      </select>
                      {errors.category && <p className="mt-1 text-sm text-danger">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-main mb-1">
                        {t('report.desc_label')} <span className="text-danger">*</span>
                      </label>
                      <textarea 
                        {...register("description")}
                        rows={5}
                        placeholder={t('report.desc_placeholder')}
                        className={`w-full rounded-lg border ${errors.description ? 'border-danger' : 'border-slate-300'} bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                      ></textarea>
                      {errors.description && <p className="mt-1 text-sm text-danger">{errors.description.message}</p>}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-text-main mb-2">
                        Message Vocal (Optionnel)
                      </label>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        ref={audioInputRef}
                        onChange={handleAudioUpload} 
                      />
                      {audioPreview ? (
                        <div className="flex items-center gap-4 bg-slate-100 p-3 rounded-lg border border-slate-200">
                          <audio src={audioPreview} controls className="flex-1 h-10" />
                          <button 
                            type="button"
                            onClick={removeAudio}
                            className="bg-white hover:bg-red-500 hover:text-white text-text-main p-2 rounded-full shadow-sm transition-colors"
                            title="Supprimer l'audio"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          {isRecording ? (
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="flex-1 bg-red-500 text-white py-2.5 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-pulse"
                            >
                              <FaStop /> Arrêter l'enregistrement
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="flex-1 bg-white border border-slate-300 text-text-main py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaMicrophone /> Enregistrer un message
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => audioInputRef.current.click()}
                            className="flex-1 bg-white border border-slate-300 text-text-main py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                          >
                            <FaUpload /> Importer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-text-main mb-4 border-b border-slate-100 pb-2">{t('report.step3')}</h3>
                    
                    <input 
                      type="file" 
                      accept="image/*, video/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handlePhotoUpload} 
                    />
                    
                    <div 
                      className={`relative border-2 border-dashed ${photoPreview || isCameraActive ? 'border-primary' : 'border-slate-300'} rounded-lg p-2 flex flex-col items-center justify-center bg-slate-50 transition-colors min-h-[200px] overflow-hidden`}
                    >
                      {isCameraActive ? (
                        <div className="flex flex-col items-center w-full py-4">
                          <video ref={videoRef} autoPlay playsInline className="w-full max-h-[300px] object-cover rounded-md bg-black" />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="flex gap-4 mt-4 w-full justify-center px-4">
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="flex-1 max-w-[150px] bg-white border border-slate-300 text-text-main py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                            >
                              {t('report.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="flex-1 max-w-[150px] bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaCamera /> Capturer
                            </button>
                          </div>
                        </div>
                      ) : photoPreview ? (
                        <>
                          {fileType && fileType.startsWith('video/') ? (
                            <video src={photoPreview} controls className="w-full h-full object-contain absolute inset-0 z-0" />
                          ) : (
                            <img src={photoPreview} alt={t('report.preview')} className="w-full h-full object-contain absolute inset-0 z-0" />
                          )}
                          <button 
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-2 right-2 z-10 bg-surface hover:bg-red-500 hover:text-white text-text-main p-2 rounded-full shadow-sm transition-colors"
                            title={t('report.delete_photo')}
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 w-full">
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                            <FaUpload className="text-xl" />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4 md:px-12">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex-1 bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaCamera /> {t('report.take_photo')}
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current.click()}
                              className="flex-1 bg-white border border-slate-300 text-text-main py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaImage /> {t('report.import_image')}
                            </button>
                          </div>
                          <p className="text-xs text-text-muted mt-6">{t('report.upload_format')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Carte Interactive */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                      <FaMapMarkerAlt className="text-primary" />
                      {t('report.step2')} <span className="text-danger">*</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      className="text-sm flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-text-main px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      <FaCrosshairs className={isLocating ? "animate-spin" : ""} />
                      {isLocating ? t('report.searching') : t('report.locate_me')}
                    </button>
                  </div>
                  <p className="text-sm text-text-muted mb-4">{t('report.map_instructions')}</p>
                  
                  <div className={`h-[400px] rounded-lg overflow-hidden border-2 ${errors.location ? 'border-danger' : 'border-slate-200'}`}>
                    <MapContainer 
                      center={mapCenter} 
                      zoom={12} 
                      className="w-full h-full z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapController center={mapCenter} />
                      <LocationSelector setLocationValue={setValue} initialPosition={initialLocation} />
                    </MapContainer>
                  </div>
                  {errors.location && <p className="mt-2 text-sm text-danger font-medium">{errors.location.message}</p>}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Link to="/my-reports">
                  <Button variant="ghost" type="button">{t('report.cancel')}</Button>
                </Link>
                <Button variant="accent" type="submit" loading={isSubmitting}>
                  {editId ? "Renvoyer le signalement" : t('report.submit')}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
