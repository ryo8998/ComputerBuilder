const config = {
    targetId : "target",
    endPointUrl : "https://api.recursionist.io/builder/computers",
}

// 各モデルのベンチマークスコアをオブジェクト形式で持つ名前空間
class BenchMarkScore{
    static BenchMarkScore = {};
}
// 各パーツの親クラス
class Parts{
    constructor(brand,model){
        this.brand = brand;
        this.model = model;
        this.benchmark = BenchMarkScore.BenchMarkScore[model];
    }
    toString(){
        return this.brand + " " + this.model;
    }
}

class CPU extends Parts{
    constructor(brand,model){
        super(brand,model);
        this.name = "cpu";
    }
}

class GPU extends Parts{
    constructor(brand,model){
        super(brand,model);
        this.name = "gpu";
    }
}

class Memory extends Parts{
    constructor(size,brand,model){
        super(brand,model);
        this.size = size;
        this.name = "ram";
    }
    // オーバーライド
    toString(){
        return this.size + " " + this.brand + " " + this.model; 
    }
}

class Strage extends Parts{
    constructor(type,size,brand,model){
        super(brand,model);
        this.size = size;
        this.name = type;
    }
    // オーバーライド
    toString(){
        return this.name.toUpperCase() + " " + this.size + " " + this.brand + " " + this.model; 
    }
}

class PC{
    // 各PCに割り付けるid変数を静的に持つ
    static id = 1;
    constructor(cpu,gpu,memory,strage){
        this.id = PC.id;
        this.cpu = cpu;
        this.gpu = gpu;
        this.memory = memory;
        this.strage = strage;
        PC.id ++;
    }
    // 構成部品からベンチマークスコアを算出
    getBenchScoreForWork(){
        return Math.round(this.cpu.benchmark * 0.6 + this.gpu.benchmark * 0.25 + this.memory.benchmark * 0.1 + this.strage.benchmark * 0.05);
    }
    getBenchScoreForGame(){
        if(this.strage.type==="ssd"){
            return Math.round(this.cpu.benchmark * 0.6 + this.gpu.benchmark * 0.25 + this.memory.benchmark * 0.125 + this.strage.benchmark * 0.1);
        }
        return Math.round(this.cpu.benchmark * 0.6 + this.gpu.benchmark * 0.25 + this.memory.benchmark * 0.125 + this.strage.benchmark * 0.05);
    }
}

class Model{
    static fetchAPI = async parts =>{
        try{
            let res = await fetch(config.endPointUrl + "?type=" + parts);
            let data = await res.json();
            return data;
        }catch(e){
            console.log("Something is wrong!!",e);        
        }  
    };
    static getBrand = async (parts,size=null) => {
        let arr = [];
        let data = await Model.fetchAPI(parts);
        data = size ? Model.filterBySize(data,size): data;
        for(let ele of data) arr.push(ele.Brand);
        return [...new Set(arr)].sort();
    };
    
    static getModel = async (parts,brand,size=null) => {
        let arr = [];
        let data = await Model.fetchAPI(parts);
        data = Model.filterByBrand(data,brand);
        data = size ? Model.filterBySize(data,size):data;
        for(let ele of data){ 
            arr.push(ele.Model);
            BenchMarkScore.BenchMarkScore[ele.Model] = ele.Benchmark;
        };
        return [...new Set(arr)].sort();
    }

    static getSizeInfo = async (strageType=null) => {
        let arr = [];
        let data = await Model.fetchAPI(strageType?strageType:"ram");
        for(let ele of data){ arr.push(ele.Model)};
        arr = arr.map(ele=>Model.extractSizeInfo(ele))
        return [...new Set(arr)].sort(Model.compareSize);
    }

    static filterByBrand(arr,brand){
        return arr.filter(ele => ele.Brand===brand);
    }

    static filterBySize(arr,size){
        return arr.filter(ele => Model.extractSizeInfo(ele.Model) === size)
    }

    static extractSizeInfo(string){
        let re = /\d+(GB|TB)/;
        let result = re.exec(string)[0];
        return result;
    }

    static getStrageType(){
        let radioInput = document.querySelectorAll("#radio-group input");
        let strageType;
        for(let ele of radioInput){
            if(ele.checked) strageType = ele.value;
        }
        return strageType;
    }

    static compareSize(a,b){
        let unitA = /\D+/.exec(a)[0];
        let unitB = /\D+/.exec(b)[0];
        let numA = /\d+/.exec(a)[0];
        let numB = /\d+/.exec(b)[0];
        if(unitA === unitB){
            return parseInt(numA) < parseInt(numB)? -1:1;
        }else{
            return unitA === "GB" ? -1:1;
        }
    }

    static getPartsInput(parts){
        let brand = document.getElementById(`${parts}-brand`);
        let model = document.getElementById(`${parts}-model`);
        let size = document.getElementById(`${parts}-size`);
        return (parts === "cpu"||parts === "gpu")? [brand.value,model.value]:[size.value,brand.value,model.value];
    };

    static checkAllSelected(...Args){
        for(let ele of Args){
            if(!ele) {
                alert("You need to select all information");
                return false;
            }
        }
        return true;
    }
}



class View{
    static makeInitialPage(){
        let container = document.createElement('div');
        container.classList.add("container-fluid", "bg-light","vh-100");
        container.innerHTML = `
        <div class="bg-dark my-3 text-center text-white flex-column">
        <h1>Build your own PC</h1>
        </div>

        <div id="cpu-form" class="my-3 mx-2 d-flex align-items-start flex-column">
        </div>

        <div id="gpu-form" class="my-3 mx-2 d-flex align-items-start flex-column">
        </div>

        <div id="memory-form" class="my-3 mx-2 d-flex align-items-start flex-column">
        </div>

        <div id="strage-form" class="my-3 mx-2 d-flex align-items-start flex-column">
        </div>

        <div id="add-button" class="my-3 mx-2 d-flex align-items-start flex-column">
        </div>

        <div id="pc-display" class="my-3 mx-2 d-flex align-items-start flex-column">
        </div>
        `
        container.querySelectorAll("#cpu-form")[0].append(View.makeCPUForm());
        container.querySelectorAll("#gpu-form")[0].append(View.makeGPUForm());
        container.querySelectorAll("#memory-form")[0].append(View.makeMemoryForm());
        container.querySelectorAll("#strage-form")[0].append(View.makeStorageForm());
        container.querySelectorAll("#add-button")[0].append(View.makeAddButton());
        return container
    }

    static makeCPUForm(){
        let container = document.createElement('div');
        container.classList.add("d-flex","col-12","justify-content-center","flex-column","mt-3","flex-wrap");
        container.innerHTML = `
        <div>
            <h3>Step:1 Select your CPU</h3>
        </div>
        <div class="d-flex justify-content-start mt-1 col-12 flex-wrap">
            <div class="mx-2 col-sm-4">
                <label for="cpu-brand">Brand : </label>
                <select class="col-6 px-0" id="cpu-brand">
                    <option  value="">--Select your Brand--</option>
                </select>
            </div>
            <div class="mx-2 col-sm-4">
                <label for="cpu-model">Model : </label>
                <select class="col-6 px-0" id="cpu-model">
                    <option  value="">-</option>
                </select>
            </div>
        </div>
        `
        let selectEle = container.querySelectorAll("#cpu-brand")[0];
        selectEle.addEventListener("change",function(){   
            Controller.setModel("cpu",selectEle.value);
        })
        return container;
    };

    static makeGPUForm(){
        let container = document.createElement('div');
        container.classList.add("d-flex","col-12","justify-content-center","flex-column","mt-3");
        container.innerHTML = `
        <div>
            <h3>Step:2 Select your GPU</h3>
        </div>
        <div class="d-flex justify-content-start mt-1 col-12 flex-wrap">
            <div class="mx-2 col-sm-4">
                <label for="gpu-brand">Brand : </label>
                <select class="col-6 px-0" id="gpu-brand">
                    <option  value="">--Select your Brand--</option>
                </select>
            </div>
            <div class="mx-2 col-sm-4">
                <label for="gpu-model">Model : </label>
                <select class="col-6 px-0" id="gpu-model">
                    <option  value="">-</option>
                </select>
            </div>
        </div>
        `
        let selectEle = container.querySelectorAll("#gpu-brand")[0];
        selectEle.addEventListener("change",function(){
            Controller.setModel("gpu",selectEle.value);
        })
        return container;
    }

    static makeMemoryForm(){
        let container = document.createElement('div');
        container.classList.add("d-flex","col-12","justify-content-center","flex-column","mt-3");
        container.innerHTML = `
        <div>
            <h3>Step:3 Select your memory</h3>
        </div>
        <div class="d-flex justify-content-start mt-1 col-12 flex-wrap">
            <div class="mx-2 col-sm-3">
                <label for="ram-size">How many</label>
                <select class="col-6 px-0" id="ram-size">
                    <option  value="">Select...</option>
                </select>
            </div>
            <div class="mx-2 col-sm-3">
                <label for="ram-brand">Brand : </label>
                <select class="col-6 px-0" id="ram-brand">
                    <option  value="">-</option>
                </select>
            </div>
            <div class="mx-2 col-sm-3">
                <label for="ram-model">Model : </label>
                <select class="col-6 px-0" id="ram-model">
                    <option value="">-</option>
                </select>
            </div>
        </div>
        `
        let ramSize = container.querySelectorAll("#ram-size")[0];
        ramSize.addEventListener("change",function(){
            Controller.setBrand("ram",ramSize.value);
        })
        let ramBrand = container.querySelectorAll("#ram-brand")[0];
        ramBrand.addEventListener("change",function(){
            Controller.setModel("ram",ramBrand.value,ramSize.value);
        })
        return container;
    }

    static makeStorageForm(){
        let container = document.createElement('div');
        container.classList.add("d-flex","col-12","justify-content-center","flex-column","mt-3");
        container.innerHTML = `
        <div>
            <h3>Step:4 Select your strage</h3>
        </div>
        <div class="d-flex justify-content-start my-3 flex-wrap">
            <div id="radio-group" class="mx-2 col-sm-4">
                <input type="radio" id="hdd-radio" name="hdd-or-ssd" value="hdd">
                <label for="hdd-radio">HDD</label>
                <input type="radio" id="ssd-radio" name="hdd-or-ssd" value="ssd">
                <label for="ssd-radio">SSD</label>
            </div>
            <div class="mx-2 col-sm-4">
                <label for="strage-size">Strage size : </label>
                <select class="col-6 px-0" id="strage-size">
                    <option value="">-</option>
                </select>
            </div>
            <div class="mx-2 col-sm-4">
                <label for="strage-brand">Brand : </label>
                <select class="col-6 px-0" id="strage-brand">
                    <option  value="">-</option>
                </select>
            </div>
            <div class="mx-2 col-sm-4">
                <label for="strage-model">Model : </label>
                <select class="col-6 px-0" id="strage-model">
                    <option  value="">-</option>
                </select>
            </div>
        </div>
        `
        let hddRadio = container.querySelectorAll("#hdd-radio")[0]
        hddRadio.addEventListener("change",function(){
            Controller.setStrageSize();
        })

        let ssdRadio =  container.querySelectorAll("#ssd-radio")[0]
        ssdRadio.addEventListener("change",function(){
            Controller.setStrageSize();
        })

        let strageSizeEl = container.querySelectorAll("#strage-size")[0];
        strageSizeEl.addEventListener("change",function(){
            Controller.setBrand(Model.getStrageType(),strageSizeEl.value);
        })

        let strageBrandEl = container.querySelectorAll("#strage-brand")[0];
        strageBrandEl.addEventListener("change",function(){
            Controller.setModel(Model.getStrageType(),strageBrandEl.value,strageSizeEl.value);

        })
        return container;
    }
    static makeAddButton(){
        let container = document.createElement('div');
        container.innerHTML = `
        <div class="d-flex align-items-start">
            <button id="add-pc-button" class="btn btn-lg btn-primary mx-3">Add PC</button>
            <p>クリック結果を以下に表示</p>
        </div>
        `
        let addPCButton = container.querySelectorAll("#add-pc-button")[0];
        addPCButton.addEventListener('click',function(){
            Controller.addPC();
        })
        return container;
    }

    static displayPC(pcObject){
        if(pcObject.id===1){
            let container = document.createElement('div');
            container.classList.add("col-12","wrap-scroll-table")
            container.innerHTML = `
                <table id="pc-display-table" class="table table-dark col-12 text-center">
                    <thead>
                        <tr>
                        <th scope="col">ID</th>
                        <th scope="col">CPU</th>
                        <th scope="col">GPU</th>
                        <th scope="col">Memory</th>
                        <th scope="col">Strage</th>
                        <th scope="col">Working</th>
                        <th scope="col">Game</th>
        
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <th scope="row">${pcObject.id}</th>
                        <td>${pcObject.cpu.toString()}</td>
                        <td>${pcObject.gpu.toString()}</td>
                        <td>${pcObject.memory.toString()}</td>
                        <td>${pcObject.strage.toString()}</td>
                        <td>${pcObject.getBenchScoreForWork()}</td>
                        <td>${pcObject.getBenchScoreForGame()}</td>
                        </tr>
                    </tbody>
                </table>
            `
            let parent = document.getElementById("pc-display");
            parent.append(container);
        }else{
            let tableEl = document.getElementById("pc-display-table");
            let newRow  = tableEl.insertRow(-1);
            newRow.insertCell(0).append(`${pcObject.id}`);
            newRow.insertCell(1).append(`${pcObject.cpu.toString()}`);
            newRow.insertCell(2).append(`${pcObject.gpu.toString()}`);
            newRow.insertCell(3).append(`${pcObject.memory.toString()}`);
            newRow.insertCell(4).append(`${pcObject.strage.toString()}`);
            newRow.insertCell(5).append(`${pcObject.getBenchScoreForWork()}`);
            newRow.insertCell(6).append(`${pcObject.getBenchScoreForGame()}`);  

        }
    }

    static makeOptions(parentEle,optionsArr){
        let options = `<option value=}>Select...</option>`;
        for(let option of optionsArr){
            options += 
            `<option value="${option}">${option}</option>`
        }
        parentEle.innerHTML = options;
    }
};



class Controller{
    static loadInitialPage(){
        document.getElementById(config.targetId).append(View.makeInitialPage());
        Controller.setBrand("cpu");
        Controller.setBrand("gpu");
        Controller.setMemorySize();
    }

    static setBrand(parts,size=null){
        Model.getBrand(parts,size).then(data =>{
            parts = (parts=="hdd" || parts=="ssd")? "strage":parts;
            View.makeOptions(document.getElementById(`${parts}-brand`),data);
        })
    }

    static setModel(parts,brand,size=null){
        Model.getModel(parts,brand,size).then(data => {
            console.log(data);
            parts = (parts=="hdd" || parts=="ssd")? "strage":parts;
            View.makeOptions(document.getElementById(`${parts}-model`),data);
        })
    }
    static setMemorySize(){
        Model.getSizeInfo().then(data => {
            View.makeOptions(document.getElementById("ram-size"),data);
        })
    }

    static setStrageSize(){
        let strageType = Model.getStrageType();
        Model.getSizeInfo(strageType).then(data => {
            View.makeOptions(document.getElementById("strage-size"),data);
        })
    }

    static addPC(){
        let cpuInput = Model.getPartsInput("cpu");
        let gpuInput = Model.getPartsInput("gpu");
        let memoryInput = Model.getPartsInput("ram");
        let strageInput = Model.getPartsInput("strage");
        if(Model.checkAllSelected(...cpuInput,...gpuInput,...memoryInput,...strageInput)){
            let cpu = new CPU(...cpuInput);
            let gpu = new GPU(...gpuInput);
            let memory = new Memory(...memoryInput);
            let strageType = Model.getStrageType();
            let strage = new Strage(strageType,...strageInput);
            let pc = new PC(cpu,gpu,memory,strage);
            View.displayPC(pc);
        };
    }
}

Controller.loadInitialPage();
