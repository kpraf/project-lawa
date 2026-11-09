function card({image, name, role}) {
    return (
        <div class="flex-col w-[330px] h-[400px]">
            <div class="w-full h-[50%] bg-gray-300 relative flex flex-col items-center rounded-t-lg">
                <div class="">
                    <img src={image} class="-top-[50px] z-0 relative"></img>
                </div>
            </div>
            <div class="w-full h-[5%] bg-gradient-to-r from-mapua-blue to-mapua-red z-10 relative"></div>
            <div class="flex flex-col w-full h-[40%] bg-white relative text-left rounded-b-lg shadow-lg">
                <p class="font-open-sans font-bold ml-5 mt-3">
                    {name}
                </p>
                <p class="font-open-sans ml-5">
                    {role}
                </p>
            </div>
        </div>
    )
}

export default card;