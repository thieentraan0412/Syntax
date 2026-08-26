/**
 * `id` của hai ô tìm kiếm trong trang.
 *
 * Phím tắt `/` và `Ctrl+K` cần trỏ tới đúng ô đang có mặt: trang chủ có ô lớn
 * giữa màn hình, các trang khác chỉ có ô ở header. Đi qua `id` chứ không qua
 * ref chung vì hai ô này nằm ở hai nhánh khác hẳn nhau của cây React —
 * `SearchTrigger` là anh em cùng cấp với header, không phải cha của nó.
 */

/** Ô lớn ở giữa trang chủ. */
export const ID_O_TIM_KIEM = "o-tim-kiem";

/** Ô ở header — có mặt trên mọi trang. */
export const ID_O_TIM_KIEM_HEADER = "o-tim-kiem-header";
