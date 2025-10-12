package event

type TranscodeEvent struct {
	ImgID     string `json:"imgId"`
	AccessKey string `json:"accessKey"`
}

type CreateImageEvent struct {
	ImgId string `json:"imgId"`
	AccessKey string `json:"accessKey"`
	Resolution string `json:"resolution"`
}

